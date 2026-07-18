import React, { useState, useMemo, useEffect } from "react";

export type RecordStatus = "Pending" | "Accepted" | "Rejected";

export interface RecordData {
  id: string;
  companyName: string;
  country: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: RecordStatus;
  dateAdded: string;
  website?: string;
  linkedin?: string;
  sourceFile: string;
  category?: "Companies" | "Filipino Community Organizations";
}

interface RecordsTableProps {
  records: RecordData[];
}

export function RecordsTable({ records }: RecordsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({
    country: [],
    industry: [],
    status: [],
    dateAdded: [],
  });

  // Compute unique values for dropdowns
  const uniqueCountries = useMemo(() => Array.from(new Set(records.map(r => r.country))).sort(), [records]);
  const uniqueStatuses = useMemo(() => Array.from(new Set(records.map(r => r.status || "Pending"))).sort(), [records]);
  const uniqueDates = useMemo(() => Array.from(new Set(records.map(r => r.dateAdded))).sort(), [records]);
  const uniqueIndustries = useMemo(() => {
    const all = new Set<string>();
    records.forEach(r => {
      const inds = (r.industry || "General").split(',').map(i => i.replace(/[\[\]'"]/g, '').trim());
      inds.forEach(i => { if (i) all.add(i) });
    });
    return Array.from(all).sort();
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    let result = records.filter((record) => {
      if (filters.country.length > 0 && !filters.country.includes(record.country)) return false;
      if (filters.status.length > 0 && !filters.status.includes(record.status || "Pending")) return false;
      if (filters.dateAdded.length > 0 && !filters.dateAdded.includes(record.dateAdded)) return false;
      
      if (filters.industry.length > 0) {
        const recordInds = (record.industry || "General").split(',').map(i => i.replace(/[\[\]'"]/g, '').trim());
        if (!filters.industry.some(selected => recordInds.includes(selected))) return false;
      }
      return true;
    });

    if (sortConfig) {
      result = result.sort((a, b) => {
        const nameA = a.companyName.toLowerCase();
        const nameB = b.companyName.toLowerCase();
        if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [records, filters, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

  // Reset page when records change substantially
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredRecords.length, totalPages, currentPage]);

  const toggleFilter = (columnKey: string, val: string) => {
    setFilters(prev => {
      const current = prev[columnKey];
      if (current.includes(val)) {
        return { ...prev, [columnKey]: current.filter(v => v !== val) };
      } else {
        return { ...prev, [columnKey]: [...current, val] };
      }
    });
  };

  const toggleSort = () => {
    setSortConfig(current => {
      if (!current) return { direction: 'asc' };
      if (current.direction === 'asc') return { direction: 'desc' };
      return null;
    });
  };

  const FilterDropdown = ({ 
    columnKey, 
    label, 
    options 
  }: { 
    columnKey: string, 
    label: string, 
    options: string[]
  }) => {
    const isOpen = openFilter === columnKey;
    const selected = filters[columnKey];
    const hasFilter = selected.length > 0;

    return (
      <div className="inline-block relative ml-2" onClick={e => e.stopPropagation()}>
        <button 
          onClick={() => setOpenFilter(isOpen ? null : columnKey)}
          className={`p-1 rounded-md transition-colors ${hasFilter ? 'bg-[#046241] text-white dark:bg-[#ffb347] dark:text-[#133020]' : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenFilter(null); }} />
            <div className="absolute top-full left-0 mt-1 w-56 max-h-64 overflow-y-auto bg-white dark:bg-[#1a1714] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 p-2 text-sm font-medium text-gray-700 dark:text-gray-200">
               <div className="flex justify-between items-center px-2 pb-2 mb-2 border-b border-gray-100 dark:border-white/5">
                  <span className="text-[10px] uppercase font-bold text-gray-400">{label}</span>
                  {hasFilter && (
                     <button 
                       onClick={() => setFilters(f => ({ ...f, [columnKey]: [] }))}
                       className="text-[10px] text-red-500 hover:underline font-bold"
                     >
                       Clear
                     </button>
                  )}
               </div>
               {options.length === 0 ? (
                 <div className="px-2 py-1 text-xs text-gray-400 font-bold">No options</div>
               ) : (
                 options.map(opt => (
                   <label key={opt} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={selected.includes(opt)} 
                       onChange={() => toggleFilter(columnKey, opt)}
                       className="rounded border-gray-300 text-[#046241] focus:ring-[#046241]"
                     />
                     <span className="truncate text-xs font-bold text-[#133020] dark:text-gray-200">{opt}</span>
                   </label>
                 ))
               )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-white dark:bg-[#14120e] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col min-h-[600px]">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[1250px]">
          <thead>
            <tr className="bg-[#f5eedb]/60 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                <div 
                  className="flex items-center cursor-pointer group select-none hover:text-[#133020] dark:hover:text-white transition-colors"
                  onClick={toggleSort}
                >
                  Company Name
                  <button className={`ml-2 p-1 rounded-md transition-colors ${sortConfig ? 'bg-[#046241] text-white dark:bg-[#ffb347] dark:text-[#133020]' : 'text-gray-400 group-hover:bg-black/5 dark:group-hover:bg-white/10'}`}>
                    {sortConfig?.direction === 'asc' ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
                    ) : sortConfig?.direction === 'desc' ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path></svg>
                    ) : (
                      <svg className="w-3 h-3 opacity-50 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
                    )}
                  </button>
                </div>
              </th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Classification</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                <div className="flex items-center">
                  Country
                  <FilterDropdown columnKey="country" label="Country" options={uniqueCountries} />
                </div>
              </th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                <div className="flex items-center">
                  Industry
                  <FilterDropdown columnKey="industry" label="Industry" options={uniqueIndustries} />
                </div>
              </th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Contact Person</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Phone</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                <div className="flex items-center">
                  Status
                  <FilterDropdown columnKey="status" label="Status" options={uniqueStatuses} />
                </div>
              </th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                <div className="flex items-center">
                  Date Added
                  <FilterDropdown columnKey="dateAdded" label="Date" options={uniqueDates} />
                </div>
              </th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Links</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-sm font-bold text-gray-400">
                  No records matching the selected criteria.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-[#046241]/5 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="py-4 px-6 text-sm font-black text-[#133020] dark:text-white whitespace-nowrap group-hover:text-[#046241] dark:group-hover:text-[#ffb347] transition-colors">
                    {record.companyName}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-[#133020]/5 text-[#133020] dark:bg-white/10 dark:text-gray-300">
                      {record.category || "Companies"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {record.country}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex gap-1 flex-wrap">
                      {(record.industry && record.industry !== "General") 
                        ? record.industry.split(',').map((ind, idx) => {
                            const cleanInd = ind.replace(/[\[\]'"]/g, '').trim();
                            if (!cleanInd) return null;
                            return (
                              <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#f5eedb] text-[#133020] dark:bg-[#1c1915] dark:text-[#ffb347] border border-[#ffb347]/30">
                                {cleanInd}
                              </span>
                            );
                          })
                        : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#f5eedb] text-[#133020] dark:bg-[#1c1915] dark:text-[#ffb347] border border-[#ffb347]/30">
                            General
                          </span>
                        )
                      }
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{record.contactPerson || "Not Provided"}</span>
                      <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{record.email || "No Email"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs font-mono font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {record.phone || "Not Provided"}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                        record.status === "Accepted"
                          ? "bg-[#046241]/10 text-[#046241] border-[#046241]/20 dark:bg-[#4ade80]/10 dark:text-[#4ade80]"
                          : record.status === "Rejected"
                          ? "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400"
                          : "bg-[#ffb347]/15 text-[#b45309] border-[#ffb347]/30 dark:text-[#ffb347]"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          record.status === "Accepted"
                            ? "bg-[#046241] dark:bg-[#4ade80]"
                            : record.status === "Rejected"
                            ? "bg-red-600"
                            : "bg-[#ffb347]"
                        }`}
                      />
                      {record.status || "Pending"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs font-bold text-gray-400 whitespace-nowrap">
                    {record.dateAdded}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {record.linkedin && (
                        <a href={record.linkedin} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-[#0077b5]/10 text-[#0077b5] hover:bg-[#0077b5]/20 font-bold text-[10px]">
                          LinkedIn
                        </a>
                      )}
                      {record.website && (
                        <a href={record.website.startsWith('http') ? record.website : `https://${record.website}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 text-[10px] font-bold">
                          Web
                        </a>
                      )}
                      {!record.linkedin && !record.website && <span className="text-gray-300 text-xs">-</span>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar (50 records per page) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50/70 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
          Showing <span className="text-[#133020] dark:text-white font-black">{filteredRecords.length === 0 ? 0 : startIndex + 1}</span> to <span className="text-[#133020] dark:text-white font-black">{Math.min(startIndex + pageSize, filteredRecords.length)}</span> of <span className="text-[#046241] dark:text-[#ffb347] font-black">{filteredRecords.length}</span> total records (50 per page)
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-white/10 bg-white dark:bg-[#181512] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            Previous
          </button>
          
          <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#046241]/10 text-[#046241] dark:bg-white/10 dark:text-white">
            Page {safeCurrentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages || filteredRecords.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-white/10 bg-white dark:bg-[#181512] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
