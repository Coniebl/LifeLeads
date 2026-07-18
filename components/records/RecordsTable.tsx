import React, { useState } from "react";

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

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedRecords = records.slice(startIndex, startIndex + pageSize);

  // Reset page when records change substantially
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [records.length, totalPages, currentPage]);

  return (
    <div className="w-full bg-white dark:bg-[#14120e] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1250px]">
          <thead>
            <tr className="bg-[#f5eedb]/60 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Company Name</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Classification</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Country</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Industry</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Contact Person</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Phone</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
              <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Date Added</th>
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
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#f5eedb] text-[#133020] dark:bg-[#1c1915] dark:text-[#ffb347] border border-[#ffb347]/30">
                      {record.industry || "General"}
                    </span>
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
          Showing <span className="text-[#133020] dark:text-white font-black">{records.length === 0 ? 0 : startIndex + 1}</span> to <span className="text-[#133020] dark:text-white font-black">{Math.min(startIndex + pageSize, records.length)}</span> of <span className="text-[#046241] dark:text-[#ffb347] font-black">{records.length}</span> total records (50 per page)
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
            disabled={safeCurrentPage === totalPages || records.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-white/10 bg-white dark:bg-[#181512] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
