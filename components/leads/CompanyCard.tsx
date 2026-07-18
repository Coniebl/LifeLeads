import React from "react";

export type CompanyData = {
  name: string;
  country: string;
  industries: string[];
  leads: number;
  contactPerson?: string;
  designation?: string;
  contactNumber?: string;
  email?: string;
  linkedin?: string;
  website?: string;
  source?: string;
  category?: "Companies" | "Filipino Community Organizations";
  status?: "Pending" | "Processing" | "Accepted" | "Rejected" | "Not Active";
  updatedAt?: string;
};

export function CompanyCard({ company, onClick }: { company: CompanyData; onClick?: () => void }) {
  const initials = company.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const bgColors = [
    "bg-[#046241]",
    "bg-[#133020]",
    "bg-[#ffb347]",
    "bg-[#ffc370]",
  ];
  const charCodeSum = company.name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const bgColor = bgColors[charCodeSum % bgColors.length];

  const joinDate = "Jan 2025";
  const countryCode = company.country.substring(0, 2).toUpperCase();

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-[#1a1714] border border-[#046241]/10 dark:border-white/5 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group h-auto min-h-[220px] cursor-pointer"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg ${bgColor} shadow-md`}>
            {initials}
          </div>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-200/50 dark:border-white/5">
            {company.status || "Not Active"}
          </span>
        </div>

        <h3 className="font-bold text-[#133020] dark:text-white text-lg mb-2 truncate group-hover:text-clip group-hover:whitespace-normal transition-all" title={company.name}>
          {company.name}
        </h3>
        
        <div className="flex flex-col items-start gap-2 mb-4">
          <div className="inline-block px-3 py-1 rounded-full bg-[#046241]/10 dark:bg-[#046241]/30 text-[10px] font-bold text-[#046241] dark:text-[#4ade80] uppercase tracking-wider">
            {company.industries.length > 0 ? company.industries[0] : "General"}
          </div>
          <div className="flex items-center gap-1.5 truncate max-w-full text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="uppercase text-[9px] text-[#ffb347] font-black">{countryCode}</span>
            <span className="truncate">{company.country}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5 truncate">
          <svg className="w-3.5 h-3.5 text-[#046241] dark:text-[#ffb347]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="truncate">{company.contactPerson || "No Contact"}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {joinDate}
        </div>
      </div>
    </div>
  );
}
