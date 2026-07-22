import { NextResponse } from 'next/server';
import { ALLOWED_LOCATIONS } from '../../../lib/locations';

export async function POST(request: Request) {
  try {
    const { location, industries, category, engine, existingCompanyNames = [] } = await request.json();

    if (!location) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }

    const industryStr = Array.isArray(industries) && industries.length > 0 ? industries.join(", ") : (industries || "Business");
    
    // For Filipino Community Organizations, override the search keywords
    const searchIndustry = category === "Filipino Community Organizations" 
      ? "Filipino Community Organizations" 
      : industryStr;
      
    const searchIndustryArray = category === "Filipino Community Organizations"
      ? ["Non-Profit Organization Management", "Civic & Social Organization"]
      : (Array.isArray(industries) ? industries.filter(i => i !== "All" && i !== "Business") : []);

    const apifyKey = process.env.APIFY_API_KEY;
    if (!apifyKey) {
      return NextResponse.json({ error: "APIFY_API_KEY is not set." }, { status: 400 });
    }

    let actorId = "";
    let payload: any = {};

    if (engine === 'agent1') {
      // IoSHqwTR9YGhzccez - Leads Finder [Apollo Alternative]
      actorId = "IoSHqwTR9YGhzccez";
      payload = {
        "fetch_count": 1000
      };
      
      const locLower = location.toLowerCase();
      const isLocationAllowed = ALLOWED_LOCATIONS.some(l => l.toLowerCase() === locLower);
      
      if (isLocationAllowed) {
        payload.contact_location = [location];
      }
      
      // If the location is a custom typed string not in the enum, add it to keywords so it still searches!
      let keywordsToUse = [...searchIndustryArray];
      if (!isLocationAllowed) {
        keywordsToUse.push(location);
      }
      
      if (keywordsToUse.length > 0) {
         // Agent 1 also enforces strict enums for company_industry (e.g. "internet", "retail"). 
         // By only setting company_keywords, we bypass the enum check and allow custom industries!
         payload.company_keywords = keywordsToUse;
      }
    } else if (engine === 'agent2') {
      // T1XDXWc1L92AfIJtd - Leads Scraper Apollo | LinkedIn
      actorId = "T1XDXWc1L92AfIJtd";
      
      payload = {
        "totalResults": 1000,
        "includeEmails": true,
        "personLocations": [location],
        "companyLocations": [location]
      };
      
      // Agent 2 requires specific enums for the 'industry' field and will crash if given custom keywords like "FinTech".
      // By ONLY passing to 'industryKeywords', we bypass the strict enum validation and allow ANY custom industry!
      const keywordsToUse = searchIndustryArray.length > 0 ? searchIndustryArray : ["Information Technology and Services", "Financial Services", "Management Consulting", "Marketing and Advertising", "Real Estate"];
      payload.industryKeywords = keywordsToUse;
    } else if (engine === 'serpapi') {
      const serpApiKey = process.env.SERPAPI_KEY;
      if (!serpApiKey) {
        return NextResponse.json({ error: "SERPAPI_KEY is not set." }, { status: 400 });
      }
      const q = `${searchIndustryArray.length > 0 ? searchIndustryArray[0] : (industries[0] || "Business")} in ${location}`;
      const serpRes = await fetch(`https://serpapi.com/search.json?engine=google_local&q=${encodeURIComponent(q)}&api_key=${serpApiKey}`);
      
      if (!serpRes.ok) {
         return NextResponse.json({ error: "SerpApi request failed" }, { status: 500 });
      }
      const serpData = await serpRes.json();
      const localResults = serpData.local_results || [];
      
      const mapped = localResults.map((r: any) => ({
         company_name: r.title || "",
         contact_person: "Not Provided",
         designation: "Not Provided",
         contact_email: "",
         contact_telephone: r.phone || "",
         office_location: r.address || location,
         company_website: r.website || r.links?.website || "",
         company_linkedin: "",
         industries: r.type || searchIndustryArray[0] || industries[0] || "Unspecified",
         country: location
      }));
      
      const finalResults = mapped.filter((r: any) => r.company_name !== "" && (r.contact_email !== "" || r.contact_telephone !== ""));
      return NextResponse.json({ results: finalResults });
    } else {
      return NextResponse.json({ error: "Invalid engine specified." }, { status: 400 });
    }

    console.log(`Attempting Apify scrape with ${engine} (${actorId})...`);
    
    const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyKey}&waitForFinish=120`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!runRes.ok) {
      const errData = await runRes.json();
      throw new Error(`Apify Error: ${errData.error?.message || runRes.statusText}`);
    }

    let finalResults: any[] = [];
    const runData = await runRes.json();
    const datasetId = runData?.data?.defaultDatasetId;
    
    if (datasetId) {
       const datasetRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyKey}`);
       if (datasetRes.ok) {
          const items = await datasetRes.json();
          if (items && items.length > 0) {
             // Filter out dummy items that Apify actors sometimes output as logs
             let cleanItems = items.filter((r: any) => {
               if (typeof r.fullName === 'string' && r.fullName.includes("Refer to the log")) return false;
               if (typeof r.name === 'string' && r.name.includes("Refer to the log")) return false;
               return true;
             });

             const mappedResults = cleanItems.map((r: any) => {
               // Robust mapping for various Apollo/LinkedIn payload structures
               const companyName = r.company?.name || r.organizationName || r.organization?.name || r.company_name || r.companyName || r.company || r.organization || "";
               const contactPerson = r.name || r.fullName || (r.first_name ? `${r.first_name} ${r.last_name || ""}`.trim() : "") || r.personName || `${r.firstName || ""} ${r.lastName || ""}`.trim() || "";
               const designation = r.title || r.jobTitle || r.job_title || r.position || r.headline || r.personTitle || "";
               
               let email = r.email || r.contact_email || r.work_email || r.personEmail || "";
               if (!email && r.emails && Array.isArray(r.emails) && r.emails.length > 0) email = r.emails[0].email || r.emails[0] || "";
               
               let phone = r.phone || r.contact_phone || r.companyPhone || r.personPhone || r.mobilePhone || r.telephone || r.organizationPhone || r.mobileNumber || r.directDial || r.officePhone || r.organization?.primary_phone?.number || r.company?.phone || (typeof r.phone_numbers === 'string' ? r.phone_numbers : "") || (typeof r.phoneNumbers === 'string' ? r.phoneNumbers : "") || "";
               if (!phone && r.phoneNumbers && Array.isArray(r.phoneNumbers) && r.phoneNumbers.length > 0) phone = r.phoneNumbers[0] || "";
               if (!phone && r.phone_numbers && Array.isArray(r.phone_numbers) && r.phone_numbers.length > 0) phone = r.phone_numbers[0].number || r.phone_numbers[0] || "";

               const website = r.website || r.organizationWebsite || r.company_website || r.organization?.website_url || r.company?.website || r.companyDomain || r.domain || "";
               const linkedin = r.linkedin_url || r.organizationLinkedinUrl || r.linkedin || r.company_linkedin || r.companyLinkedinUrl || r.personLinkedinUrl || r.organization?.linkedin_url || "";
               const officeLoc = r.city || r.organizationCity || r.state || r.country || r.location || r.company?.location || r.personLocation || r.companyState || r.personState || "";

               // Extract the actual industry from the scraper response, default to what the user inputted
               let actualIndustry = "";
               if (r.industry) actualIndustry = r.industry;
               else if (r.organizationIndustry) actualIndustry = r.organizationIndustry;
               else if (r.company_industry) actualIndustry = r.company_industry;
               else if (r.company?.industry) actualIndustry = r.company.industry;
               else if (r.organization?.industry) actualIndustry = r.organization.industry;
               else if (r.categories) actualIndustry = r.categories;
               else if (r.categoryName) actualIndustry = r.categoryName;
               else if (r.category) actualIndustry = r.category;
               
               if (Array.isArray(actualIndustry)) actualIndustry = actualIndustry.join(", ");
               
               if (!actualIndustry || actualIndustry.trim() === "") {
                  actualIndustry = (industryStr && industryStr !== "All") ? industryStr : "Unspecified";
               }

               return {
                 company_name: companyName || (contactPerson ? `${contactPerson}'s Business` : ""),
                 contact_person: contactPerson || "Not Provided",
                 designation: designation || "Not Provided",
                 contact_email: email,
                 contact_telephone: phone,
                 office_location: officeLoc,
                 company_website: website,
                 company_linkedin: linkedin,
                 industries: category === "Filipino Community Organizations" ? "Filipino Community Organizations" : actualIndustry,
                 country: location
               };
             });
             // Filter out records that don't have a company name or are already in the database
             const uniqueResults = mappedResults.filter((r: any) => {
               if (!r.company_name || r.company_name.trim() === "") return false;
               if (existingCompanyNames.includes(r.company_name.toLowerCase())) return false;
               return true;
             });

             // Bucket A: Leads with BOTH email and phone
             const strictLeads = uniqueResults.filter((r: any) => {
               const hasEmail = r.contact_email && r.contact_email.trim() !== "";
               const hasPhone = (r.contact_telephone && r.contact_telephone.trim() !== "") || (r.contact_mobile && r.contact_mobile.trim() !== "");
               return hasEmail && hasPhone;
             });

             // Bucket B: Leads with ONLY email (no phone)
             const emailOnlyLeads = uniqueResults.filter((r: any) => {
               const hasEmail = r.contact_email && r.contact_email.trim() !== "";
               const hasPhone = (r.contact_telephone && r.contact_telephone.trim() !== "") || (r.contact_mobile && r.contact_mobile.trim() !== "");
               return hasEmail && !hasPhone;
             });

             // Fill up to 100 results, prioritizing strict leads
             if (strictLeads.length >= 100) {
               finalResults = strictLeads.slice(0, 100);
             } else {
               const needed = 100 - strictLeads.length;
               finalResults = [...strictLeads, ...emailOnlyLeads.slice(0, needed)];
             }
          }
       }
    }
    
    if (finalResults.length === 0) {
      return NextResponse.json({ error: `${engine} returned 0 results. Try broadening your search.` }, { status: 404 });
    }

    return NextResponse.json({ results: finalResults });

  } catch (error: any) {
    console.error("Scan API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to scan clients" }, { status: 500 });
  }
}
