import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { type CompanyData } from "../leads/CompanyCard";
import { SelectDropdown } from "../ui/SelectDropdown";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export function StatusView({ 
  companies, 
  setCompanies 
}: { 
  companies: CompanyData[];
  setCompanies?: React.Dispatch<React.SetStateAction<CompanyData[]>>;
}) {
  const searchParams = useSearchParams();
  const [statusTab, setStatusTab] = useState<"Pending" | "Responded" | "Not Active">("Pending");
  const [selectedClassification, setSelectedClassification] = useState("All Classifications");
  const [classificationFilterOpen, setClassificationFilterOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState("All Files");
  const [selectedIndustry, setSelectedIndustry] = useState("All Industries");
  const [selectedCountry, setSelectedCountry] = useState("All Countries");
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Poll Outlook integration API for new replies every 1 minute
  useEffect(() => {
    const checkReplies = async () => {
      try {
        setIsSyncing(true);
        const res = await fetch('/api/outlook/check-replies');
        const data = await res.json();
        if (data.success && data.message.includes('Updated') && !data.message.includes('0 leads')) {
          window.location.reload(); 
        }
      } catch (err) {
        console.error('Failed to sync outlook replies:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    checkReplies();
    const interval = setInterval(checkReplies, 60000);
    return () => clearInterval(interval);
  }, []);

  // 1. Derive dropdown filter options
  const allClassifications = ["All Classifications", "Companies", "Filipino Community Organizations"];
  const allSources = ["All Files", ...Array.from(new Set(companies.map(c => c.source).filter(Boolean)))];
  const allIndustries = ["All Industries", ...Array.from(new Set(companies.flatMap(c => c.industries)))];
  const allCountries = ["All Countries", ...Array.from(new Set(companies.map(c => c.country)))];

  // 2. Apply dropdown filters
  const filteredCompanies = companies.filter(c => {
    const matchClassification = selectedClassification === "All Classifications" || (c.category || "Companies") === selectedClassification;
    const matchSource = selectedSource === "All Files" || c.source === selectedSource;
    const matchIndustry = selectedIndustry === "All Industries" || c.industries.includes(selectedIndustry);
    const matchCountry = selectedCountry === "All Countries" || c.country === selectedCountry;
    return matchClassification && matchSource && matchIndustry && matchCountry;
  });

  // 3. Derived Stats
  const totalCount = filteredCompanies.length;
  const pendingCount = filteredCompanies.filter(c => c.status === "Pending").length;
  const respondedCount = filteredCompanies.filter(c => c.status === "Responded").length;
  const inactiveCount = filteredCompanies.filter(c => !c.status || c.status === "Not Active").length;

  // 4. Filter by active Status Pill (Pending, Responded, Not Active)
  const tabulatedCompanies = filteredCompanies.filter(c => {
    if (statusTab === "Responded") return c.status === "Responded";
    if (statusTab === "Not Active") return !c.status || c.status === "Not Active";
    return c.status === "Pending";
  });

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Accepted": return "text-[#046241] bg-[#046241]/10 border-[#046241]/20 dark:text-[#4ade80] dark:bg-[#4ade80]/10";
      case "Rejected": return "text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800";
      case "Pending": return "text-[#b45309] bg-[#ffb347]/15 border-[#ffb347]/30 dark:text-[#ffb347] dark:bg-[#ffb347]/10";
      case "Responded": return "text-[#0d9488] bg-[#0d9488]/15 border-[#0d9488]/30 dark:text-[#2dd4bf] dark:bg-[#0d9488]/10";
      default: return "text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700";
    }
  };

  const getIconColor = (status?: string) => {
    switch (status) {
      case "Accepted": return "bg-[#046241]";
      case "Rejected": return "bg-red-600";
      case "Pending": return "bg-[#ffb347]";
      case "Responded": return "bg-[#0d9488]";
      default: return "bg-gray-400 dark:bg-gray-500";
    }
  };

  const handleExport = async () => {
    const wb = new ExcelJS.Workbook();
    
    const generateExportData = (companies: typeof filteredCompanies) => {
      return companies.map(c => ({
        "Company Name": c.name,
        "Contact Person": c.contactPerson || "Not Provided",
        "Designation": c.designation || "Not Provided",
        "Contact Mobile": c.contactMobile || "Not Provided",
        "Contact Telephone": c.contactTelephone || "Not Provided",
        "Email": c.email || "Not Provided",
        "Industry": c.industries.join(", "),
        "Country": c.country,
        "Status": c.status || "Not Active",
        "Source File": c.source || "Unknown",
        "Joined/Updated": c.updatedAt || "N/A",
        "LinkedIn": c.linkedin || "",
        "Website": c.website || ""
      }));
    };

    const allData = generateExportData(filteredCompanies);
    const notActiveData = generateExportData(filteredCompanies.filter(c => !c.status || c.status === "Not Active"));
    const pendingData = generateExportData(filteredCompanies.filter(c => c.status === "Pending"));
    const respondedData = generateExportData(filteredCompanies.filter(c => c.status === "Responded"));
    const acceptedData = generateExportData(filteredCompanies.filter(c => c.status === "Accepted"));
    const rejectedData = generateExportData(filteredCompanies.filter(c => c.status === "Rejected"));

    const addSheet = (data: any[], name: string, tabColor: string) => {
      const ws = wb.addWorksheet(name);
      ws.properties.tabColor = { argb: tabColor };
      
      const displayData = data.length > 0 ? data : [{
        "Company Name": "", "Contact Person": "", "Designation": "", 
        "Contact Mobile": "", "Contact Telephone": "", "Email": "", "Industry": "", "Country": "", 
        "Status": "", "Source File": "", "Joined/Updated": "", 
        "LinkedIn": "", "Website": ""
      }];
      
      const headers = Object.keys(displayData[0]);
      ws.columns = headers.map(h => ({ header: h, key: h, width: 20 }));
      
      if (data.length > 0) {
        ws.addRows(data);
      } else {
        // Add an empty row just to get headers formatted properly
        ws.addRow(headers.reduce((acc, h) => ({...acc, [h]: ""}), {}));
      }
      
      ws.getRow(1).eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF046241' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center' };
      });
      
      ws.columns.forEach(col => {
        let maxLen = 0;
        col.eachCell!({ includeEmpty: true }, cell => {
          maxLen = Math.max(maxLen, cell.value ? cell.value.toString().length : 0);
        });
        col.width = Math.min(Math.max(maxLen + 2, 10), 50);
      });
    };

    addSheet(allData, "All", "FF046241"); // Lifewood Green
    addSheet(notActiveData, "Not Active", "FF9CA3AF"); // Gray
    addSheet(pendingData, "Pending", "FFF59E0B"); // Orange
    addSheet(respondedData, "Responded", "FF0D9488"); // Blue Green
    addSheet(acceptedData, "Accepted", "FF10B981"); // Bright Green
    addSheet(rejectedData, "Rejected", "FFEF4444"); // Red

    const safeTitle = selectedClassification.replace(/[\/\?\*\[\]:]/g, "_").substring(0, 31);
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `LifeLeads_Status_All_${safeTitle}.xlsx`);
    
    // Log export to localStorage for the Dashboard Calendar to track
    try {
      const storedExports = JSON.parse(localStorage.getItem('lifelead_exports') || '[]');
      storedExports.push({
        date: new Date().toISOString(),
        category: selectedClassification,
        count: filteredCompanies.length
      });
      localStorage.setItem('lifelead_exports', JSON.stringify(storedExports));
      window.dispatchEvent(new Event('lifelead_export'));
    } catch (e) {
      console.error("Failed to log export", e);
    }
    
    showToast(`Exported ${filteredCompanies.length} records across 6 sheets!`);
  };

  const handleUpdateStatus = async (newStatus: "Accepted" | "Rejected" | "Responded") => {
    if (!selectedCompany) return;
    setIsUpdating(true);
    try {
      const { supabase } = await import("../../lib/supabase/client");
      const { error } = await supabase
        .from('company_contacts')
        .update({ 
          status: newStatus,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', selectedCompany.id);

      if (error) {
        console.error("Status update error:", error);
      }

      if (setCompanies) {
        setCompanies(prev => prev.map(item => item.id === selectedCompany.id ? { ...item, status: newStatus } : item));
      }

      window.dispatchEvent(new CustomEvent('companyStatusUpdated', {
        detail: { companyId: selectedCompany.id, status: newStatus }
      }));

      showToast(`Status changed to ${newStatus} for ${selectedCompany.name}!`);
      setSelectedCompany(null);
    } catch (e) {
      console.error(e);
      showToast("Error updating status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce bg-[#133020] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#046241] flex items-center gap-3 font-bold text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffb347] animate-pulse"></span>
          {toastMessage}
        </div>
      )}

      {/* Header & Subcategory Switcher & Export Data */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] md:text-4xl font-black tracking-tight mb-1">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#133020] via-[#046241] to-[#b45309] dark:from-[#4ade80] dark:via-[#2dd4bf] dark:to-[#ffb347]">
              Status
            </span>
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Monitor and update offer decisions · {tabulatedCompanies.length} showing in {statusTab}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Export Data Button right beside top header */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-[#ffb347] hover:bg-[#ffa726] text-[#133020] text-sm font-bold rounded-xl shadow-md shadow-[#ffb347]/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Data
          </button>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "TOTAL", count: totalCount, color: "text-[#046241] dark:text-[#4ade80]", glow: "dark:border-[#4ade80] dark:shadow-[0_0_15px_rgba(74,222,128,0.25)]" },
          { label: "NOT ACTIVE", count: inactiveCount, color: "text-gray-500 dark:text-gray-400", glow: "dark:border-gray-400 dark:shadow-[0_0_15px_rgba(156,163,175,0.25)]" },
          { label: "PENDING", count: pendingCount, color: "text-[#ffb347] dark:text-[#ffb347]", glow: "dark:border-[#ffb347] dark:shadow-[0_0_15px_rgba(255,179,71,0.25)]" },
          { label: "RESPONDED", count: respondedCount, color: "text-[#0d9488] dark:text-[#2dd4bf]", glow: "dark:border-[#2dd4bf] dark:shadow-[0_0_15px_rgba(45,212,191,0.25)]" },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-white dark:bg-[#14120e] border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm transition-all ${stat.glow}`}>
            <span className={`text-3xl font-black ${stat.color}`}>{stat.count}</span>
            <span className="text-[10px] font-bold text-gray-400 tracking-widest mt-1">{stat.label}</span>
          </div>
        ))}
      </div>



      {/* Status Pills above tabulated display (Pending, Responded, Not Active) */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-3">
        <div className="flex items-center flex-wrap gap-2">
          {(["Not Active", "Pending", "Responded"] as const).map((tab) => {
            const count = filteredCompanies.filter(c => {
              if (tab === "Responded") return c.status === "Responded";
              if (tab === "Not Active") return !c.status || c.status === "Not Active";
              return c.status === "Pending";
            }).length;

            return (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all duration-300 ease-in-out cursor-pointer ${
                  statusTab === tab
                    ? tab === "Responded"
                      ? "bg-[#0d9488] text-white shadow-md shadow-[#0d9488]/20 scale-105"
                      : tab === "Not Active"
                      ? "bg-gray-400 text-white shadow-md shadow-gray-400/20 scale-105"
                      : "bg-[#ffb347] text-[#133020] shadow-md shadow-[#ffb347]/20 scale-105"
                    : "bg-white dark:bg-[#14120e] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${tab === "Responded" ? "bg-teal-300" : tab === "Not Active" ? "bg-gray-200" : "bg-[#133020]"}`}></span>
                {tab}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusTab === tab ? "bg-black/20 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SelectDropdown
            value={selectedSource}
            onChange={setSelectedSource}
            options={allSources.map(s => ({ label: String(s), value: String(s) }))}
            className="flex items-center justify-between gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-[#046241]/20 dark:border-white/10 hover:border-[#046241]/50 dark:hover:border-white/30 transition-all bg-white dark:bg-[#1c1915] text-[#133020] dark:text-gray-200 min-w-[180px] shadow-xs"
            dropdownClassName="absolute top-full right-0 mt-2 w-[220px] bg-white dark:bg-[#1c1915] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden"
            optionClassName="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors truncate"
            activeOptionClassName="w-full text-left px-4 py-2.5 text-sm font-bold bg-[#046241]/5 dark:bg-[#ffb347]/10 text-[#046241] dark:text-[#ffb347] truncate"
          />
        </div>
      </div>

      {/* Tabulated Display */}
      <div className="flex-1 bg-white dark:bg-[#14120e] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col min-h-[360px]">
        {/* Table Header */}
        <div className="grid grid-cols-[40px_auto_2.5fr_1fr_1.5fr_1.5fr_1.2fr_100px] gap-4 items-center px-6 py-4 bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 text-[11px] font-black text-gray-400 uppercase tracking-widest overflow-visible">
          <div>No.</div>
          <div className="w-10"></div>
          <div>Name / Organization</div>
          <div className="flex items-center gap-1 relative">
            Classification
            <button 
              onClick={(e) => { e.stopPropagation(); setClassificationFilterOpen(!classificationFilterOpen); }}
              className={`p-1 rounded-md transition-colors cursor-pointer ${selectedClassification !== "All Classifications" ? 'bg-[#046241] text-white dark:bg-[#ffb347] dark:text-[#133020]' : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/10'}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
            {classificationFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setClassificationFilterOpen(false); }} />
                <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-[#1a1714] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 p-2 text-sm font-medium text-gray-700 dark:text-gray-200 normal-case font-sans">
                   <div className="flex justify-between items-center px-2 pb-2 mb-2 border-b border-gray-100 dark:border-white/5">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Classification</span>
                      {selectedClassification !== "All Classifications" && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); setSelectedClassification("All Classifications"); setClassificationFilterOpen(false); }}
                           className="text-[10px] text-red-500 hover:underline font-bold cursor-pointer"
                         >
                           Clear
                         </button>
                      )}
                   </div>
                   {allClassifications.slice(1).map(opt => (
                     <label key={opt} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={selectedClassification === opt} 
                         onChange={(e) => {
                           e.stopPropagation();
                           setSelectedClassification(selectedClassification === opt ? "All Classifications" : opt);
                         }}
                         className="rounded border-gray-300 text-[#046241] focus:ring-[#046241]"
                       />
                       <span className="truncate text-xs font-bold text-[#133020] dark:text-gray-200">{opt}</span>
                     </label>
                   ))}
                </div>
              </>
            )}
          </div>
          <div>Contact Person</div>
          <div>Industry</div>
          <div>Status</div>
          <div className="text-right">Updated</div>
        </div>

        {/* Table Rows */}
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {tabulatedCompanies.length > 0 ? (
            tabulatedCompanies.map((company, i) => (
              <div
                key={i}
                onClick={() => setSelectedCompany(company)}
                className="grid grid-cols-[40px_auto_2.5fr_1fr_1.5fr_1.5fr_1.2fr_100px] gap-4 items-center px-4 py-3.5 rounded-xl hover:bg-[#046241]/5 dark:hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-[#046241]/20 dark:hover:border-white/10"
              >
                {/* Number */}
                <div className="text-sm font-bold text-gray-400 dark:text-gray-500 pl-2">
                  {i + 1}
                </div>

                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner flex-shrink-0 ${getIconColor(company.status)}`}>
                  {getInitials(company.name)}
                </div>

                {/* Name */}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-[#133020] dark:text-white whitespace-normal break-words max-w-xs group-hover:text-[#046241] dark:group-hover:text-[#ffb347] transition-colors">
                    {company.name}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 whitespace-normal break-words max-w-xs mt-1">
                    {company.country} · {company.source || "Manual Entry"}
                  </span>
                </div>
                
                {/* Classification */}
                <div className="text-[11px] font-bold text-gray-600 dark:text-gray-300 whitespace-normal break-words max-w-[120px]">
                  {company.category || "Companies"}
                </div>

                {/* Contact Person & Designation */}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-normal break-words max-w-[150px]">
                    {company.contactPerson || "Not Provided"}
                  </span>
                  <span className="text-[11px] font-medium text-[#046241] dark:text-[#ffb347] whitespace-normal break-words max-w-[150px] mt-1">
                    {company.designation || "Representative"}
                  </span>
                </div>

                {/* Industry */}
                <div className="flex flex-wrap gap-1 items-center">
                  {company.industries.length > 0 ? (
                    company.industries.map((ind, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold text-[#133020] dark:text-[#ffb347] bg-[#f5eedb] dark:bg-[#1c1915] border border-[#ffb347]/30 truncate max-w-[180px]">
                        {ind}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold text-[#133020] dark:text-[#ffb347] bg-[#f5eedb] dark:bg-[#1c1915] border border-[#ffb347]/30 truncate max-w-[180px]">
                      General
                    </span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusColor(company.status || "Not Active")}`}>
                    <span className={`w-2 h-2 rounded-full ${company.status === 'Accepted' ? 'bg-[#046241] dark:bg-[#4ade80]' : company.status === 'Rejected' ? 'bg-red-600' : company.status === 'Responded' ? 'bg-[#0d9488] dark:bg-[#2dd4bf]' : company.status === 'Pending' ? 'bg-[#ffb347]' : 'bg-gray-400'}`} />
                    {company.status || "Not Active"}
                  </span>
                </div>

                {/* Date */}
                <div className="text-right text-xs font-bold text-gray-400 whitespace-nowrap">
                  {company.updatedAt || "Today"}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-52 text-gray-400 space-y-2">
              <span className="text-base font-bold text-gray-500 dark:text-gray-400">No companies found in "{statusTab}"</span>
              <p className="text-xs text-gray-400">Try selecting a different tab or adjusting your filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Row Click Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#14120e] rounded-3xl max-w-xl w-full p-6 md:p-8 border border-gray-100 dark:border-white/10 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setSelectedCompany(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 pr-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg shrink-0 ${getIconColor(selectedCompany.status)}`}>
                {getInitials(selectedCompany.name)}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-[#133020] dark:text-white leading-tight">
                  {selectedCompany.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#046241]/10 text-[#046241] dark:bg-white/10 dark:text-gray-300">
                    {selectedCompany.country}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(selectedCompany.status || "Not Active")}`}>
                    {selectedCompany.status || "Not Active"}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#f5eedb]/50 dark:bg-[#1c1915] rounded-2xl border border-[#ffb347]/20 dark:border-white/5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Contact Person</span>
                <p className="text-sm font-black text-[#133020] dark:text-gray-200">
                  {selectedCompany.contactPerson || "Not Provided"}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Designation / Role</span>
                <p className="text-sm font-black text-[#046241] dark:text-[#ffb347]">
                  {selectedCompany.designation || "Executive Representative"}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Mobile / Direct</span>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 font-mono">
                  {selectedCompany.contactMobile || "Not Provided"}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Telephone</span>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 font-mono">
                  {selectedCompany.contactTelephone || "Not Provided"}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Contact Email</span>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">
                  {selectedCompany.email || "No Email Registered"}
                </p>
              </div>

              <div className="md:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Industries</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedCompany.industries.map((ind, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-[#14120e] text-[#133020] dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-2xs">
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Links Section */}
            <div className="flex items-center gap-3">
              {selectedCompany.linkedin && (
                <a
                  href={selectedCompany.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0077b5]/10 text-[#0077b5] hover:bg-[#0077b5]/20 flex items-center justify-center gap-2 transition-all"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                  LinkedIn Profile
                </a>
              )}
              {selectedCompany.website && (
                <a
                  href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center gap-2 transition-all"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Official Website
                </a>
              )}
            </div>

            {/* Offer Decision Action Buttons */}
            {selectedCompany.status && selectedCompany.status !== "Not Active" ? (
              <div className="border-t border-gray-100 dark:border-white/10 pt-5 flex flex-col sm:flex-row items-center gap-3 justify-between">
                
                {/* Left Side: Waiting for Response / Responded + View Button */}
                <div className="flex items-center gap-2">
                  {selectedCompany.status === "Pending" ? (
                    <div className="group relative flex flex-col items-start">
                      <div 
                        onDoubleClick={async () => {
                          // Developer Test Hook: Double click to simulate Outlook response
                          try {
                            setIsUpdating(true);
                            await fetch('/api/outlook/mock-reply', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ companyId: selectedCompany.id })
                            });
                            
                            // Update UI state seamlessly instead of reloading the page
                            if (setCompanies) {
                              setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? { ...c, status: "Responded" } : c));
                            }
                            setSelectedCompany(prev => prev ? { ...prev, status: "Responded" } : null);
                            showToast("Simulated response received!");
                          } finally {
                            setIsUpdating(false);
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-500 bg-gray-100 dark:bg-white/5 dark:text-gray-400 select-none cursor-pointer"
                      >
                        Waiting for response
                      </div>
                      <span className="absolute -bottom-6 left-0 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        (Double-click to simulate Outlook reply for testing)
                      </span>
                    </div>
                  ) : (selectedCompany.status === "Responded" || selectedCompany.status === "Accepted" || selectedCompany.status === "Rejected") ? (
                    <button 
                      onClick={() => window.open('https://outlook.live.com/mail/0/', '_blank')}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#0d9488] hover:bg-teal-700 active:scale-95 transition-all shadow-md shadow-[#0d9488]/20 cursor-pointer" 
                      title="View Response"
                    >
                      View Response
                    </button>
                  ) : null}
                </div>

                {/* Right Side removed as per new flow */}
                <div className="flex items-center gap-3">
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-100 dark:border-white/10 pt-5 flex items-center justify-center">
                <p className="text-xs font-bold text-gray-400">
                  This lead is Not Active. Process it from the Leads tab first.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
