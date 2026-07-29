import React, { useState, useRef, useEffect } from "react";

export interface CountryOption {
  label: string;
  value: string;
  count?: number;
  children?: { label: string; value: string; count?: number }[];
}

export function CountrySelectDropdown({
  value,
  onChange,
  options,
  icon,
  className,
  dropdownClassName,
}: {
  value: string;
  onChange: (val: string) => void;
  options: CountryOption[];
  icon?: React.ReactNode;
  className?: string;
  dropdownClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleParent = (e: React.MouseEvent, parentValue: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedParents(prev => ({ ...prev, [parentValue]: !prev[parentValue] }));
  };

  const handleSelect = (e: React.MouseEvent, val: string) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(val);
    setTimeout(() => setIsOpen(false), 50);
  };

  // Find active label
  let activeLabel = value;
  for (const opt of options) {
    if (opt.value === value) activeLabel = opt.label;
    if (opt.children) {
      for (const child of opt.children) {
        if (child.value === value) activeLabel = child.label;
      }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className={className}>
        <div className="flex items-center gap-2 truncate">
          {icon}
          <span className="truncate">{activeLabel}</span>
        </div>
        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className={dropdownClassName}>
          <div className="max-h-[350px] overflow-y-auto py-1 custom-scrollbar">
            {options.map((opt, i) => (
              <div key={i}>
                <div className="flex items-stretch w-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                  <button
                    onClick={(e) => handleSelect(e, opt.value)}
                    className={`flex-1 flex items-center justify-between text-left px-3 py-2 text-xs transition-colors ${value === opt.value ? 'bg-[#046241]/10 dark:bg-[#046241]/30 text-[#046241] dark:text-[#ffb347] font-bold' : 'text-[#133020] dark:text-gray-300 font-medium'}`}
                  >
                    <span>{opt.label}</span>
                    {opt.count !== undefined && (
                      <span className="text-gray-400 font-semibold">{opt.count}</span>
                    )}
                  </button>
                  {opt.children && opt.children.length > 0 && (
                    <button
                      onClick={(e) => toggleParent(e, opt.value)}
                      className="px-3 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors border-l border-transparent hover:border-gray-200 dark:hover:border-white/10"
                    >
                      <svg className={`w-4 h-4 transition-transform ${expandedParents[opt.value] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
                {opt.children && opt.children.length > 0 && expandedParents[opt.value] && (
                  <div className="bg-gray-50/50 dark:bg-black/20 border-l-2 border-[#046241]/20 dark:border-[#ffb347]/20 ml-4 my-1 flex flex-col gap-0.5">
                    {opt.children.map((child, j) => (
                      <button
                        key={j}
                        onClick={(e) => handleSelect(e, child.value)}
                        className={`w-full flex items-center justify-between text-left pl-5 pr-3 py-2 text-[11px] transition-colors ${value === child.value ? 'bg-[#046241]/5 dark:bg-[#046241]/20 text-[#046241] dark:text-[#ffb347] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5 font-medium'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#046241] dark:bg-[#ffb347]"></div>
                          <span>{child.label}</span>
                        </div>
                        {child.count !== undefined && (
                          <span className="text-gray-400 font-medium">{child.count}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


