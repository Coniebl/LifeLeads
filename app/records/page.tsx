"use client";

import React, { useState, useEffect, useRef } from "react";
import * as xlsx from "xlsx";
import { supabase, fetchAllCompanyContacts } from "../../lib/supabase/client";
import { RecordsTable, type RecordData } from "../../components/records/RecordsTable";
import { CompletedFilesModal } from "../../components/records/CompletedFilesModal";
import { ScanClientsModal } from "../../components/records/ScanClientsModal";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { SelectDropdown } from "../../components/ui/SelectDropdown";

export default function RecordsPage() {

  const [records, setRecords] = useState<RecordData[]>([]);
  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState("All Files");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New features state
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Companies" | "Filipino Community Organizations">("All");
  const [selectedImportCategory, setSelectedImportCategory] = useState<"Companies" | "Filipino Community Organizations">("Companies");
  const [timeRangeDays, setTimeRangeDays] = useState<number>(365);

  const fetchRecords = async () => {
    const { data: contactsData, error: contactsErr } = await fetchAllCompanyContacts({ column: 'id', ascending: false });

    if (contactsData && !contactsErr) {


      const formatted: RecordData[] = contactsData.map((r: any) => {
        const name = r.company_name;
        const inferredCat = r.category || "Companies";

        return {
          id: r.id.toString(),
          companyName: r.company_name,
          country: r.country || "Unknown",
          industry: r.industries || "General",
          contactPerson: r.contact_person || "Not Provided",
          email: r.contact_email || "",
          phone: r.contact_mobile || r.contact_direct_line || "N/A",
          telephone: r.contact_telephone || "N/A",
          status: r.status || "Not Active",
          dateAdded: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          website: r.company_website || "",
          linkedin: r.company_linkedin || "",
          sourceFile: r.source_file || "Manual Entry",
          category: inferredCat,
          createdAt: r.created_at,
        };
      });
      setRecords(formatted);
    }
  };

  useEffect(() => {
    fetchRecords();
    const handleUpdate = () => fetchRecords();
    window.addEventListener('companyStatusUpdated', handleUpdate);
    return () => window.removeEventListener('companyStatusUpdated', handleUpdate);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: "binary" });
        
        const ws = wb.Sheets[wb.SheetNames[0]]; // get first sheet
        let contactRows: any[] = [];
        
        const normalizeIndustries = (industryString: string) => {
          if (!industryString) return "";
          const parts = industryString.split(/[/,]/);
          const normalized = parts.map(p => {
            let t = p.trim();
            if (!t) return "";
            t = t.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
            if (t === "E-commerce" || t === "E-Commerce") t = "E-Commerce";
            else if (t === "Healthtech" || t === "Healthcare Staffing Tech") t = "HealthTech";
            else if (t === "Fintech") t = "FinTech";
            else if (t === "Edtech") t = "EdTech";
            else if (t === "Medtech") t = "MedTech";
            else if (t === "B2b Saas") t = "B2B SaaS";
            return t;
          }).filter(Boolean);
          return Array.from(new Set(normalized)).join(", ");
        };

        if (ws) {
          const rawData = xlsx.utils.sheet_to_json(ws);
          contactRows = rawData.map((row: any) => {
            return {
              company_name: row["Company Name"] ? String(row["Company Name"]).trim() : "",
              contact_person: row["Contact Person"] || "",
              designation: row["Designation"] || "",
              contact_mobile: String(row["Contact (Mobile)"] || ""),
              contact_telephone: String(row["Contact (Telephone)"] || ""),
              contact_fax: String(row["Contact (Fax)"] || ""),
              contact_direct_line: String(row["Contact (Direct Line)"] || ""),
              contact_email: row["Contact Email"] || "",
              office_location: row["Office location"] || "",
              country: row["Country"] || "",
              company_website: row["Company Website"] || "",
              company_linkedin: row["Company LinkedIn"] || "",
              industries: normalizeIndustries(row["Industry Type"]),
              source_file: file.name,
              status: "Not Active",
              category: selectedImportCategory,
            };
          }).filter((row: any) => row.company_name !== "" && row.company_name.toLowerCase() !== "unknown" && row.company_name !== "-");
        }


        
        if (contactRows.length > 0) {
          const { error: contactError } = await supabase.from('company_contacts').insert(contactRows);
          if (contactError) {
            console.error("Error inserting contacts:", contactError.message, contactError.details, contactError.hint);
            alert(`Failed to import company details: ${contactError.message}`);
            return;
          }
          fetchRecords();
          window.dispatchEvent(new Event('companyStatusUpdated'));
        } else {
          alert("No valid data found in the Excel sheet.");
        }
      } catch (err) {
        console.error("Failed to parse Excel:", err);
        alert("Invalid Excel file. Ensure it has 'Industry' and 'Company Details' sheets.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const availableFiles = Array.from(new Set(
    records
      .filter((r) => {
        if (categoryFilter === "All") return true;
        if (categoryFilter === "Companies") return !r.category || r.category === "Companies";
        return r.category === "Filipino Community Organizations";
      })
      .map((r) => r.sourceFile)
      .filter(Boolean)
  ));

  const formattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    const isCompleted = completedFiles.includes(r.sourceFile);
    if (isCompleted) return false;

    // Category pill filter
    if (categoryFilter !== "All") {
      const matchCat = categoryFilter === "Companies"
        ? (!r.category || r.category === "Companies")
        : r.category === "Filipino Community Organizations";
      if (!matchCat) return false;
    }

    // Time range filter
    if (timeRangeDays < 365) {
      const recDate = new Date(r.dateAdded).getTime();
      const diffDays = (Date.now() - recDate) / (1000 * 3600 * 24);
      if (diffDays > timeRangeDays && !isNaN(diffDays)) return false;
    }

    const matchesSearch =
      r.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.status.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFile = selectedFile === "All Files" || r.sourceFile === selectedFile;

    return matchesSearch && matchesFile;
  });

  const statusOrder: Record<string, number> = { "Not Active": 1, "Pending": 2, "Accepted": 3, "Rejected": 4 };
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const orderA = a.status ? statusOrder[a.status] : 4;
    const orderB = b.status ? statusOrder[b.status] : 4;
    return orderA - orderB;
  });

  const handleMarkAsComplete = () => {
    if (selectedFile !== "All Files" && !completedFiles.includes(selectedFile)) {
      setCompletedFiles([...completedFiles, selectedFile]);
      setSelectedFile("All Files");
    } else {
      alert("Please select a specific Excel file from the dropdown to mark as complete.");
    }
  };

  const handleDeleteCompletedFiles = async (filesToDelete: string[]) => {
    try {
      const recordsToDelete = records.filter(r => filesToDelete.includes(r.sourceFile));
      const deletedImports = JSON.parse(localStorage.getItem('lifelead_deleted_imports') || '[]');
      
      recordsToDelete.forEach(r => {
        deletedImports.push({
          date: r.createdAt || r.dateAdded,
          category: r.category || "Companies"
        });
      });
      localStorage.setItem('lifelead_deleted_imports', JSON.stringify(deletedImports));
      window.dispatchEvent(new Event('lifelead_deleted_import'));
    } catch(e) {
      console.error("Failed to log deleted imports", e);
    }

    const { error } = await supabase.from('company_contacts').delete().in('source_file', filesToDelete);
    
    if (!error) {
      setCompletedFiles(completedFiles.filter(f => !filesToDelete.includes(f)));
      fetchRecords();
      window.dispatchEvent(new Event('companyStatusUpdated'));
    } else {
      console.error("Failed to delete files from database:", error.message);
      alert("Failed to delete records from the database.");
    }
    setIsModalOpen(false);
  };

  return (
    <>
        
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[32px] md:text-4xl font-black tracking-tight mb-1">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#133020] via-[#046241] to-[#b45309] dark:from-[#4ade80] dark:via-[#2dd4bf] dark:to-[#ffb347]">
                Records Manager
              </span>
            </h1>
          </div>

          {/* Import section with Subcategory Dropdown right next to file name/before import button */}
          <div className="flex flex-wrap items-center gap-3 mt-2 xl:mt-0 p-2 bg-white/60 dark:bg-[#14120e]/60 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
            <span className="text-sm font-bold text-[#133020] dark:text-gray-300 ml-2 uppercase tracking-wider hidden sm:inline">
              Import Category:
            </span>
            <div className="relative z-50">
              <SelectDropdown
                value={selectedImportCategory}
                onChange={(val) => setSelectedImportCategory(val as any)}
                options={[
                  { label: "Companies", value: "Companies" },
                  { label: "Filipino Community Organizations", value: "Filipino Community Organizations" }
                ]}
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[#f5eedb] dark:bg-[#1c1915] text-[#133020] dark:text-[#ffb347] border border-[#046241]/20 dark:border-white/10 hover:bg-[#ebdcae] dark:hover:bg-[#2a261f] focus:outline-none cursor-pointer shadow-sm transition-colors flex items-center justify-between gap-3 min-w-[140px]"
                dropdownClassName="absolute top-full mt-2 left-0 w-full min-w-[280px] bg-white dark:bg-[#1a1714] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
                optionClassName="w-full text-left px-4 py-3 text-sm font-medium text-[#133020] dark:text-gray-300 hover:bg-[#f5eedb] dark:hover:bg-white/5 transition-colors"
                activeOptionClassName="w-full text-left px-4 py-3 text-sm font-bold bg-[#046241]/10 dark:bg-[#046241]/30 text-[#046241] dark:text-[#ffb347] transition-colors"
              />
            </div>

            <input
              type="file"
              accept=".xlsx, .xls"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button 
              onClick={() => setIsScanModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#046241] to-[#ffb347] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#046241]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Scan for Clients
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 px-6 py-3 bg-[#046241] hover:bg-[#034d33] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#046241]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              {isImporting ? "Importing..." : "Import Excel"}
            </button>
          </div>
        </div>

        {/* Time Range Slider directly below overview / header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full p-4 mb-6 bg-white/70 dark:bg-[#14120e]/70 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#046241]/10 dark:bg-[#ffb347]/10 text-[#046241] dark:text-[#ffb347]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-black text-[#133020] dark:text-white uppercase tracking-wider block">
                Time Range Filter: {timeRangeDays >= 365 ? "All Time" : `Last ${timeRangeDays} Days`}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                Filter records based on the timeline they were added or updated
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto flex-1 max-w-md">
            <input
              type="range"
              min="1"
              max="365"
              value={timeRangeDays}
              onChange={(e) => setTimeRangeDays(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#046241] dark:accent-[#ffb347]"
            />
            <div className="flex gap-1.5 shrink-0">
              {[
                { label: "7D", val: 7 },
                { label: "30D", val: 30 },
                { label: "90D", val: 90 },
                { label: "All", val: 365 },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={() => setTimeRangeDays(b.val)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    timeRangeDays === b.val
                      ? "bg-[#046241] text-white dark:bg-[#ffb347] dark:text-[#133020] shadow-xs"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search, File Select & 3-Pill Navigation (All, Companies, Filipino Community Organizations) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 w-full mb-5">
          {/* 3-Pill Classification Navigation defaulting to All */}
          <div className="flex p-1 bg-white dark:bg-[#14120e] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs">
            {(["All", "Companies", "Filipino Community Organizations"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCategoryFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  categoryFilter === tab
                    ? "bg-[#046241] text-white shadow-md shadow-[#046241]/20 scale-[1.02]"
                    : "text-gray-600 dark:text-gray-300 hover:text-[#046241] dark:hover:text-[#ffb347]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Input and File dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 lg:max-w-xl">
            <div className="relative w-full flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records keyword..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#14120e] border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#046241] dark:focus:ring-[#ffb347] transition-all placeholder-gray-400"
              />
            </div>

            <div className="relative w-full sm:w-48">
              <CustomSelect
                options={["All Files", ...availableFiles]}
                value={selectedFile}
                onChange={setSelectedFile}
              />
            </div>
          </div>
        </div>

        {/* Record count indicator and Actions */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] text-gray-400 font-medium">
            Showing <span className="font-bold text-[#133020] dark:text-gray-200">{filteredRecords.length}</span> records ({categoryFilter})
          </p>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleMarkAsComplete}
              className="p-2.5 bg-white dark:bg-[#14120e] border border-gray-200/60 dark:border-white/10 rounded-xl text-[#046241] dark:text-[#4ade80] shadow-2xs hover:scale-105 transition-all cursor-pointer"
              title="Mark as complete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </button>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="relative p-2.5 bg-white dark:bg-[#14120e] border border-gray-200/60 dark:border-white/10 rounded-xl text-[#133020] dark:text-gray-200 shadow-2xs hover:scale-105 transition-all cursor-pointer"
              title="Completed Files"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              {completedFiles.length > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-md ring-2 ring-white dark:ring-[#0d0b09]">
                  {completedFiles.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Data Table with 50 items per page pagination */}
        <RecordsTable records={sortedRecords} />

      {isModalOpen && (
        <CompletedFilesModal
          completedFiles={completedFiles}
          onClose={() => setIsModalOpen(false)}
          onDeleteFiles={handleDeleteCompletedFiles}
        />
      )}

      {isScanModalOpen && (
        <ScanClientsModal
          onClose={() => setIsScanModalOpen(false)}
          onScanComplete={fetchRecords}
          importCategory={selectedImportCategory}
          existingCompanyNames={records.map(r => r.companyName.toLowerCase())}
        />
      )}
    </>
  );
}
