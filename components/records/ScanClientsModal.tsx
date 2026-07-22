"use client";

import React, { useState, useRef, useEffect } from "react";
import * as xlsx from "xlsx";
import { supabase } from "../../lib/supabase/client";

interface ScanClientsModalProps {
  onClose: () => void;
  onScanComplete: () => void;
  importCategory: "Companies" | "Filipino Community Organizations";
  existingCompanyNames: string[];
}

const predefinedIndustries = [
  "All",
  "information technology & services", "construction", "marketing & advertising", "real estate", "health, wellness & fitness", "management consulting", "computer software", "internet", "retail", "financial services", "consumer services", "hospital & health care", "automotive", "restaurants", "education management", "food & beverages", "design", "hospitality", "accounting", "events services", "nonprofit organization management", "entertainment", "electrical/electronic manufacturing", "leisure, travel & tourism", "professional training & coaching", "transportation/trucking/railroad", "law practice", "apparel & fashion", "architecture & planning", "mechanical or industrial engineering", "insurance", "telecommunications", "human resources", "staffing & recruiting", "sports", "legal services", "oil & energy", "media production", "machinery", "wholesale", "consumer goods", "music", "photography", "medical practice", "cosmetics", "environmental services", "graphic design", "business supplies & equipment", "renewables & environment", "facilities services", "publishing", "food production", "arts & crafts", "building materials", "civil engineering", "religious institutions", "public relations & communications", "higher education", "printing", "furniture", "mining & metals", "logistics & supply chain", "research", "pharmaceuticals", "individual & family services", "medical devices", "civic & social organization", "e-learning", "security & investigations", "chemicals", "government administration", "online media", "investment management", "farming", "writing & editing", "textiles", "mental health care", "primary/secondary education", "broadcast media", "biotechnology", "information services", "international trade & development", "motion pictures & film", "consumer electronics", "banking", "import & export", "industrial automation", "recreational facilities & services", "performing arts", "utilities", "sporting goods", "fine art", "airlines/aviation", "computer & network security", "maritime", "luxury goods & jewelry", "veterinary", "venture capital & private equity", "wine & spirits", "plastics", "aviation & aerospace", "commercial real estate", "computer games", "packaging & containers", "executive office", "computer hardware", "computer networking", "market research", "outsourcing/offshoring", "program development", "translation & localization", "philanthropy", "public safety", "alternative medicine", "museums & institutions", "warehousing", "defense & space", "newspapers", "paper & forest products", "law enforcement", "investment banking", "government relations", "fund-raising", "think tanks", "glass, ceramics & concrete", "capital markets", "semiconductors", "animation", "political organization", "package/freight delivery", "wireless", "international affairs", "public policy", "libraries", "gambling & casinos", "railroad manufacture", "ranching", "military", "fishery", "supermarkets", "dairy", "tobacco", "shipbuilding", "judiciary", "alternative dispute resolution", "nanotechnology", "agriculture", "legislative office"
];

export function ScanClientsModal({ onClose, onScanComplete, importCategory, existingCompanyNames }: ScanClientsModalProps) {
  const [location, setLocation] = useState("");
  const [predictiveLocations, setPredictiveLocations] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(["All"]);
  const [isOthersSelected, setIsOthersSelected] = useState(false);
  const [customIndustries, setCustomIndustries] = useState("");
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState("");

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch predictive locations when typing
  useEffect(() => {
    if (location.trim().length < 2) {
      setPredictiveLocations([]);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=5`);
        if (res.ok) {
          const data = await res.json();
          if (data.results) {
            const places = data.results.map((r: any) => {
              if (r.admin1 && r.country) return `${r.name}, ${r.admin1}, ${r.country}`;
              if (r.country) return `${r.name}, ${r.country}`;
              return r.name;
            });
            // Ensure unique names
            setPredictiveLocations(Array.from(new Set(places)) as string[]);
          }
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    }, 400); // Debounce
    
    return () => clearTimeout(timeoutId);
  }, [location]);

  const toggleIndustry = (ind: string) => {
    if (ind === "All") {
      setSelectedIndustries(["All"]);
    } else {
      let newSelection = selectedIndustries.filter(i => i !== "All");
      if (newSelection.includes(ind)) {
        newSelection = newSelection.filter(i => i !== ind);
      } else {
        newSelection.push(ind);
      }
      setSelectedIndustries(newSelection);
    }
  };

  const handleScan = async () => {
    if (!location.trim()) {
      alert("Please enter a location or region.");
      return;
    }

    let finalIndustries = [...selectedIndustries];
    if (isOthersSelected && customIndustries.trim()) {
       const customArr = customIndustries.split(",").map(i => i.trim()).filter(Boolean);
       finalIndustries = [...finalIndustries.filter(i => i !== "All"), ...customArr];
    }

    if (finalIndustries.length === 0 && importCategory !== "Filipino Community Organizations") {
      alert("Please select at least one industry.");
      return;
    }

    setIsScanning(true);
    let finalData = null;

    try {
      // 1. Try Agent 2 (Apollo Scraper) First
      setProgress("Scanning with Apollo Scraper (Agent 2)...");
      const agent2Res = await fetch("/api/scan-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           location, 
           industries: finalIndustries, 
           category: importCategory,
           engine: 'agent2',
           existingCompanyNames
        }),
      });

      if (agent2Res.ok) {
        const agent2Data = await agent2Res.json();
        if (agent2Data.results && agent2Data.results.length > 0) {
          finalData = agent2Data;
        } else {
          console.warn("Agent 2 returned 0 results");
        }
      } else {
        const errData = await agent2Res.json();
        console.warn("Agent 2 failed:", errData.error);
      }

      // 2. Fallback to Agent 1 (Leads Finder) if Agent 2 fails or returns 0
      if (!finalData) {
        setProgress("Apollo Scraper failed or returned 0 leads. Falling back to Leads Finder (Agent 1)...");
        const agent1Res = await fetch("/api/scan-clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
             location, 
             industries: finalIndustries, 
             category: importCategory,
             engine: 'agent1',
             existingCompanyNames
          }),
        });

        if (agent1Res.ok) {
          const agent1Data = await agent1Res.json();
          if (agent1Data.results && agent1Data.results.length > 0) {
            finalData = agent1Data;
          } else {
            console.warn("Agent 1 returned 0 results");
          }
        } else {
          const errData = await agent1Res.json();
          console.warn("Agent 1 failed:", errData.error);
        }
      }

      // No third fallback - User requested strictly Apify agents only

      if (!finalData || !finalData.results || finalData.results.length === 0) {
        alert("No clients found for this location and industry.");
        setIsScanning(false);
        return;
      }

      const uniqueResults = finalData.results;
      
      setProgress(`Found ${uniqueResults.length} new clients! Generating Excel...`);
      
      const data = { results: uniqueResults };

      // 2. Format data for Excel and Database
      const dateStr = new Date().toISOString().split("T")[0];
      const sourceFileName = `${location.trim()} - ${dateStr}.xlsx`;

      const contactRows = data.results.map((r: any) => ({
        company_name: r.company_name,
        contact_person: r.contact_person || "Not Provided",
        designation: r.designation || "Not Provided",
        contact_mobile: r.contact_mobile || "",
        contact_telephone: r.contact_telephone || "",
        contact_fax: r.contact_fax || "",
        contact_direct_line: r.contact_direct_line || "",
        contact_email: r.contact_email || "",
        office_location: r.office_location || "",
        country: r.country || location,
        company_website: r.company_website || "",
        company_linkedin: r.company_linkedin || "",
        industries: r.industries || finalIndustries.join(", "),
        source_file: sourceFileName,
        status: "Not Active",
        category: importCategory, 
      }));

      // 3. Generate Excel file and download
      const ws = xlsx.utils.json_to_sheet(contactRows.map((r: any) => ({
        "Company Name": r.company_name,
        "Contact Person": r.contact_person,
        "Designation": r.designation,
        "Contact (Mobile)": r.contact_mobile,
        "Contact (Telephone)": r.contact_telephone,
        "Contact (Fax)": r.contact_fax,
        "Contact (Direct Line)": r.contact_direct_line,
        "Contact Email": r.contact_email,
        "Office location": r.office_location,
        "Country": r.country,
        "Company Website": r.company_website,
        "Company LinkedIn": r.company_linkedin,
        "Industry Type": r.industries,
      })));

      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Company Details");
      xlsx.writeFile(wb, sourceFileName);

      // 4. Upload to Database
      setProgress("Saving to database...");
      const { error: contactError } = await supabase.from('company_contacts').insert(contactRows);
      
      if (contactError) {
        console.error("Error inserting scraped contacts:", contactError.message);
        alert(`Failed to save to database: ${contactError.message}`);
      } else {
        window.dispatchEvent(new Event('companyStatusUpdated'));
        onScanComplete();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected error occurred during scanning.");
    } finally {
      setIsScanning(false);
      setProgress("");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isScanning && onClose()} />
      <div className="relative bg-white dark:bg-[#14120e] rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10 p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200 overflow-visible">
        
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
          <h2 className="text-xl font-black text-[#133020] dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-[#046241] dark:text-[#ffb347]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Scan for Clients
          </h2>
          {!isScanning && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5" ref={locationRef}>
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              Location / Region
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowLocationSuggestions(true);
                }}
                onFocus={() => setShowLocationSuggestions(true)}
                disabled={isScanning}
                placeholder="e.g. Manila, Philippines"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#133020] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#046241] dark:focus:ring-[#ffb347] transition-all disabled:opacity-50"
              />
              {showLocationSuggestions && location.trim().length > 0 && predictiveLocations.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-[#1a1714] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto p-2">
                  {predictiveLocations.map(loc => (
                    <div 
                      key={loc} 
                      onClick={() => {
                        setLocation(loc);
                        setShowLocationSuggestions(false);
                      }}
                      className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer text-sm font-bold text-[#133020] dark:text-gray-200"
                    >
                      {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5" ref={dropdownRef}>
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              Industry Focus {importCategory === "Filipino Community Organizations" && "(Ignored)"}
            </label>
            <div className="relative">
              <div
                onClick={() => !isScanning && setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#133020] dark:text-white flex justify-between items-center cursor-pointer ${isScanning || importCategory === "Filipino Community Organizations" ? "opacity-50 pointer-events-none" : ""}`}
              >
                <span className="truncate pr-4">
                  {selectedIndustries.length > 0 ? selectedIndustries.join(", ") : "Select Industries..."}
                  {isOthersSelected ? (selectedIndustries.length > 0 ? ", Others" : "Others") : ""}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-[#1a1714] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto p-2">
                  {predefinedIndustries.map(ind => (
                    <label key={ind} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedIndustries.includes(ind)}
                        onChange={() => toggleIndustry(ind)}
                        className="rounded border-gray-300 text-[#046241] focus:ring-[#046241] w-4 h-4"
                      />
                      <span className="text-sm font-bold text-[#133020] dark:text-gray-200">{ind}</span>
                    </label>
                  ))}
                  
                  <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer border-t border-gray-100 dark:border-white/5 mt-1 pt-2">
                    <input 
                      type="checkbox"
                      checked={isOthersSelected}
                      onChange={(e) => setIsOthersSelected(e.target.checked)}
                      className="rounded border-gray-300 text-[#046241] focus:ring-[#046241] w-4 h-4"
                    />
                    <span className="text-sm font-bold text-[#133020] dark:text-gray-200">Others</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {isOthersSelected && (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
              <label className="text-[11px] font-black text-[#046241] dark:text-[#ffb347] uppercase tracking-widest">
                Custom Industries (Comma Separated)
              </label>
              <input
                type="text"
                value={customIndustries}
                onChange={(e) => setCustomIndustries(e.target.value)}
                disabled={isScanning}
                placeholder="e.g. Web3, Retail, Agriculture"
                className="w-full px-4 py-3 bg-white dark:bg-[#1a1714] border border-[#046241]/30 dark:border-[#ffb347]/30 rounded-xl text-sm font-semibold text-[#133020] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#046241] dark:focus:ring-[#ffb347] transition-all disabled:opacity-50 shadow-inner"
              />
            </div>
          )}

        </div>

        <div className="pt-2 mt-2 border-t border-gray-100 dark:border-white/5">
          <button
            onClick={handleScan}
            disabled={isScanning || !location.trim()}
            className="w-full py-3.5 px-6 rounded-xl font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#046241] to-[#ffb347] text-white shadow-xl shadow-[#046241]/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isScanning ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Scanning...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                Start Scan (100+ Clients)
              </>
            )}
          </button>
          
          {isScanning && (
            <p className="text-center text-xs font-bold text-[#046241] dark:text-[#ffb347] mt-3 animate-pulse">
              {progress}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
