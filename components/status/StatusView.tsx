import React, { useState } from "react";
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
  const selectedSubCategory = searchParams.get("category") || "Companies";
  const [statusTab, setStatusTab] = useState<"Pending" | "Accepted" | "Rejected" | "Not Active">("Pending");
  const [selectedSource, setSelectedSource] = useState("All Records");
  const [selectedIndustry, setSelectedIndustry] = useState("All Industries");
  const [selectedCountry, setSelectedCountry] = useState("All Countries");
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Filter by Subcategory
  const subCategoryCompanies = companies.filter((c) => {
    if (selectedSubCategory === "Companies") {
      return !c.category || c.category === "Companies";
    }
    return c.category === "Filipino Community Organizations";
  });

  // 2. Derive dropdown filter options from subcategory companies
  const allSources = ["All Records", ...Array.from(new Set(subCategoryCompanies.map(c => c.source).filter(Boolean)))];
  const allIndustries = ["All Industries", ...Array.from(new Set(subCategoryCompanies.flatMap(c => c.industries)))];
  const allCountries = ["All Countries", ...Array.from(new Set(subCategoryCompanies.map(c => c.country)))];

  // 3. Apply dropdown filters
  const filteredCompanies = subCategoryCompanies.filter(c => {
    const matchSource = selectedSource === "All Records" || c.source === selectedSource;
    const matchIndustry = selectedIndustry === "All Industries" || c.industries.includes(selectedIndustry);
    const matchCountry = selectedCountry === "All Countries" || c.country === selectedCountry;
    return matchSource && matchIndustry && matchCountry;
  });

  // 4. Derived Stats
  const totalCount = filteredCompanies.length;
  const acceptedCount = filteredCompanies.filter(c => c.status === "Accepted").length;
  const rejectedCount = filteredCompanies.filter(c => c.status === "Rejected").length;
  const pendingCount = filteredCompanies.filter(c => c.status === "Pending").length;
  const inactiveCount = filteredCompanies.filter(c => !c.status || c.status === "Not Active").length;

  // 5. Filter by active Status Pill (Pending, Accepted, Rejected, Not Active)
  const tabulatedCompanies = filteredCompanies.filter(c => {
    if (statusTab === "Accepted") return c.status === "Accepted";
    if (statusTab === "Rejected") return c.status === "Rejected";
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
      default: return "text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700";
    }
  };

  const getIconColor = (status?: string) => {
    switch (status) {
      case "Accepted": return "bg-[#046241]";
      case "Rejected": return "bg-red-600";
      case "Pending": return "bg-[#ffb347]";
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
        "Contact Number": c.contactNumber || "Not Provided",
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
    const acceptedData = generateExportData(filteredCompanies.filter(c => c.status === "Accepted"));
    const rejectedData = generateExportData(filteredCompanies.filter(c => c.status === "Rejected"));

    const addSheet = (data: any[], name: string, tabColor: string) => {
      const ws = wb.addWorksheet(name);
      ws.properties.tabColor = { argb: tabColor };
      
      // If data is empty, we still want headers
      const displayData = data.length > 0 ? data : [{
        "Company Name": "", "Contact Person": "", "Designation": "", 
        "Contact Number": "", "Email": "", "Industry": "", "Country": "", 
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
    addSheet(acceptedData, "Accepted", "FF10B981"); // Bright Green
    addSheet(rejectedData, "Rejected", "FFEF4444"); // Red

    const safeTitle = selectedSubCategory.replace(/[\/\?\*\[\]:]/g, "_").substring(0, 31);
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `LifeLeads_Status_All_${safeTitle}.xlsx`);
    
    // Log export to localStorage for the Dashboard Calendar to track
    try {
      const storedExports = JSON.parse(localStorage.getItem('lifelead_exports') || '[]');
      storedExports.push({
        date: new Date().toISOString(),
        category: selectedSubCategory,
        count: filteredCompanies.length
      });
      localStorage.setItem('lifelead_exports', JSON.stringify(storedExports));
      window.dispatchEvent(new Event('lifelead_export'));
    } catch (e) {
      console.error("Failed to log export", e);
    }
    
    showToast(`Exported ${filteredCompanies.length} records across 5 sheets!`);
  };

  const handleUpdateStatus = async (newStatus: "Accepted" | "Rejected") => {
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
              Status - {selectedSubCategory}
            </span>
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Monitor and update offer decisions · {tabulatedCompanies.length} showing in {statusTab}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Subcategory toggles removed in favor of sidebar navigation */}

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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "TOTAL", count: totalCount, color: "text-[#046241] dark:text-[#4ade80]", glow: "dark:border-[#4ade80] dark:shadow-[0_0_15px_rgba(74,222,128,0.25)]" },
          { label: "ACCEPTED", count: acceptedCount, color: "text-[#046241] dark:text-[#2dd4bf]", glow: "dark:border-[#2dd4bf] dark:shadow-[0_0_15px_rgba(45,212,191,0.25)]" },
          { label: "REJECTED", count: rejectedCount, color: "text-red-500 dark:text-red-400", glow: "dark:border-red-400 dark:shadow-[0_0_15px_rgba(248,113,113,0.25)]" },
          { label: "PENDING", count: pendingCount, color: "text-[#ffb347] dark:text-[#ffb347]", glow: "dark:border-[#ffb347] dark:shadow-[0_0_15px_rgba(255,179,71,0.25)]" },
          { label: "NOT ACTIVE", count: inactiveCount, color: "text-gray-500 dark:text-gray-400", glow: "dark:border-gray-400 dark:shadow-[0_0_15px_rgba(156,163,175,0.25)]" },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-white dark:bg-[#14120e] border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm transition-all ${stat.glow}`}>
            <span className={`text-3xl font-black ${stat.color}`}>{stat.count}</span>
            <span className="text-[10px] font-bold text-gray-400 tracking-widest mt-1">{stat.label}</span>
          </div>
        ))}
      </div>



      {/* Classification Pills above tabulated display (Pending, Accepted, Rejected, Not Active) */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          {(["Not Active", "Pending", "Accepted", "Rejected"] as const).map((tab) => {
            const count = filteredCompanies.filter(c => {
              if (tab === "Accepted") return c.status === "Accepted";
              if (tab === "Rejected") return c.status === "Rejected";
              if (tab === "Not Active") return !c.status || c.status === "Not Active";
              return c.status === "Pending";
            }).length;

            return (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all duration-300 ease-in-out cursor-pointer ${
                  statusTab === tab
                    ? tab === "Accepted"
                      ? "bg-[#046241] text-white shadow-md shadow-[#046241]/20 scale-105"
                      : tab === "Rejected"
                      ? "bg-red-600 text-white shadow-md shadow-red-600/20 scale-105"
                      : tab === "Not Active"
                      ? "bg-gray-400 text-white shadow-md shadow-gray-400/20 scale-105"
                      : "bg-[#ffb347] text-[#133020] shadow-md shadow-[#ffb347]/20 scale-105"
                    : "bg-white dark:bg-[#14120e] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${tab === "Accepted" ? "bg-emerald-300" : tab === "Rejected" ? "bg-red-300" : tab === "Not Active" ? "bg-gray-200" : "bg-[#133020]"}`}></span>
                {tab}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusTab === tab ? "bg-black/20 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="hidden md:block">
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
        <div className="grid grid-cols-[40px_auto_2fr_1.5fr_1.5fr_1.2fr_100px] gap-4 items-center px-6 py-4 bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
          <div>No.</div>
          <div className="w-10"></div>
          <div>Name / Organization</div>
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
                className="grid grid-cols-[40px_auto_2fr_1.5fr_1.5fr_1.2fr_100px] gap-4 items-center px-4 py-3.5 rounded-xl hover:bg-[#046241]/5 dark:hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-[#046241]/20 dark:hover:border-white/10"
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
                  <span className="text-sm font-black text-[#133020] dark:text-white truncate group-hover:text-[#046241] dark:group-hover:text-[#ffb347] transition-colors">
                    {company.name}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 truncate">
                    {company.country} · {company.source || "Manual Entry"}
                  </span>
                </div>

                {/* Contact Person & Designation */}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                    {company.contactPerson || "Not Provided"}
                  </span>
                  <span className="text-[11px] font-medium text-[#046241] dark:text-[#ffb347] truncate">
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
                    <span className={`w-2 h-2 rounded-full ${company.status === 'Accepted' ? 'bg-[#046241] dark:bg-[#4ade80]' : company.status === 'Rejected' ? 'bg-red-600' : company.status === 'Pending' ? 'bg-[#ffb347]' : 'bg-gray-400'}`} />
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
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Contact Number</span>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 font-mono">
                  {selectedCompany.contactNumber || "Not Provided"}
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

            {/* Offer Decision Action Buttons (Accepted / Rejected) */}
            {selectedCompany.status && selectedCompany.status !== "Not Active" ? (
              <div className="border-t border-gray-100 dark:border-white/10 pt-5 flex flex-col sm:flex-row items-center gap-3 justify-end">
                <button
                  disabled={isUpdating || selectedCompany.status === "Rejected"}
                  onClick={() => handleUpdateStatus("Rejected")}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {selectedCompany.status === "Rejected" ? "Already Rejected" : "Rejected Offer"}
                </button>

                <button
                  disabled={isUpdating || selectedCompany.status === "Accepted"}
                  onClick={() => handleUpdateStatus("Accepted")}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#046241] hover:bg-[#034d33] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md shadow-[#046241]/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {selectedCompany.status === "Accepted" ? "Already Accepted" : "Accepted Offer"}
                </button>
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
