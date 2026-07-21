import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { location, industries, category, engine } = await request.json();

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
        "fetch_count": 100,
        "contact_location": [location]
      };
      if (searchIndustryArray.length > 0) {
         payload.company_industry = searchIndustryArray;
         payload.company_keywords = searchIndustryArray;
      }
    } else if (engine === 'agent2') {
      // T1XDXWc1L92AfIJtd - Leads Scraper Apollo | LinkedIn
      actorId = "T1XDXWc1L92AfIJtd";
      
      let mappedCountry = "";
      const locLower = location.toLowerCase();
      if (locLower.includes("usa") || locLower.includes("united states") || locLower.includes("us")) mappedCountry = "United States";
      else if (locLower.includes("uk") || locLower.includes("united kingdom")) mappedCountry = "United Kingdom";
      else if (locLower.includes("philippines")) mappedCountry = "Philippines";
      else if (locLower.includes("canada")) mappedCountry = "Canada";
      else if (locLower.includes("australia")) mappedCountry = "Australia";
      
      payload = {
        "totalResults": 100,
        "includeEmails": true
      };
      
      if (mappedCountry) {
         payload.personCountry = [mappedCountry];
         payload.companyCountry = [mappedCountry];
      }
      
      if (searchIndustryArray.length > 0) {
         payload.industry = searchIndustryArray;
         payload.industryKeywords = searchIndustryArray;
      }
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
               
               let phone = r.phone || r.contact_phone || r.companyPhone || r.personPhone || r.mobilePhone || r.telephone || r.organizationPhone || r.mobileNumber || r.directDial || r.officePhone || r.organization?.primary_phone?.number || r.company?.phone || "";
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

             // Filter out records that don't have at least one mode of contact (Email or Phone) or no company name
             finalResults = mappedResults.filter((r: any) => {
               if (r.company_name === "") return false;
               const hasEmail = r.contact_email && r.contact_email.trim() !== "";
               const hasPhone = r.contact_telephone && r.contact_telephone.trim() !== "";
               return hasEmail || hasPhone;
             });
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
