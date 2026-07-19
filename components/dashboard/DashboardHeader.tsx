import React from "react";
import { useRouter } from "next/navigation";
import { SelectDropdown } from "../ui/SelectDropdown";

interface DashboardHeaderProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedFile: string;
  setSelectedFile: (val: string) => void;
  availableFiles: string[];
  allCompanyNames: string[];
  leadsType?: string;
  setLeadsType?: (val: string) => void;
}

export function DashboardHeader({
  searchQuery,
  setSearchQuery,
  selectedFile,
  setSelectedFile,
  availableFiles,
  allCompanyNames,
  leadsType = "All Leads",
  setLeadsType = () => {},
}: DashboardHeaderProps) {
  const router = useRouter();
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/companies?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const filteredSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allCompanyNames
      .filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8); // show max 8 suggestions
  }, [searchQuery, allCompanyNames]);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full mb-6">
      {/* Search Bar */}
      <div className="relative w-full flex-1" ref={wrapperRef}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search companies globally..."
          className="relative w-full pl-12 pr-4 py-3 bg-white dark:bg-[#181512] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#046241] dark:focus:ring-[#ffb347] transition-all placeholder-gray-400 z-10"
        />
        
        {/* Dropdown Suggestions */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1A1612] border border-gray-100 dark:border-white/5 shadow-xl rounded-xl z-50 overflow-hidden flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 py-2 border-b border-gray-100 dark:border-white/5">
              Suggested Companies
            </span>
            {filteredSuggestions.map((name) => (
              <button
                key={name}
                onClick={() => {
                  setSearchQuery(name);
                  setShowSuggestions(false);
                  router.push(`/companies?search=${encodeURIComponent(name)}`);
                }}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-[#046241]/10 dark:hover:bg-white/5 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto relative z-40">
        
        {/* Leads Type Filter */}
        <div className="relative w-full md:w-56">
          <SelectDropdown
            value={leadsType}
            onChange={(val) => setLeadsType(val)}
            options={[
              { label: "All Leads", value: "All Leads" },
              { label: "Companies", value: "Companies" },
              { label: "Filipino Community Orgs", value: "Filipino Community Organizations" }
            ]}
            icon={
              <svg className="h-4 w-4 text-[#046241] dark:text-[#ffb347] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            className="flex w-full items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-[#181512] hover:bg-gray-50 dark:hover:bg-[#23201b] hover:border-[#046241]/30 dark:hover:border-white/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-[#046241] dark:focus:ring-[#ffb347] focus:outline-none rounded-xl transition-all text-sm font-bold text-gray-700 dark:text-gray-200"
            dropdownClassName="absolute top-full mt-2 left-0 w-full min-w-[200px] bg-white dark:bg-[#1a1714] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            optionClassName="w-full text-left px-4 py-2.5 text-sm font-medium text-[#133020] dark:text-gray-300 hover:bg-[#f5eedb] dark:hover:bg-[#133020] transition-colors"
            activeOptionClassName="w-full text-left px-4 py-2.5 text-sm font-bold bg-[#046241]/10 dark:bg-[#046241]/30 text-[#046241] dark:text-[#ffb347] transition-colors"
          />
        </div>

        {/* File Dropdown Filter */}
        <div className="relative w-full md:w-64">
          <SelectDropdown
            value={selectedFile}
            onChange={(val) => setSelectedFile(val)}
            options={[
              { label: "All Files", value: "All Files" },
              ...availableFiles.map(file => ({ label: file, value: file }))
            ]}
            icon={
              <svg className="h-4 w-4 text-[#046241] dark:text-[#ffb347] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            className="flex w-full items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-[#181512] hover:bg-gray-50 dark:hover:bg-[#23201b] hover:border-[#046241]/30 dark:hover:border-white/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-[#046241] dark:focus:ring-[#ffb347] focus:outline-none rounded-xl transition-all text-sm font-bold text-gray-700 dark:text-gray-200"
            dropdownClassName="absolute top-full mt-2 right-0 w-full min-w-[200px] bg-white dark:bg-[#1a1714] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            optionClassName="w-full text-left px-4 py-2.5 text-sm font-medium text-[#133020] dark:text-gray-300 hover:bg-[#f5eedb] dark:hover:bg-[#133020] transition-colors"
            activeOptionClassName="w-full text-left px-4 py-2.5 text-sm font-bold bg-[#046241]/10 dark:bg-[#046241]/30 text-[#046241] dark:text-[#ffb347] transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
