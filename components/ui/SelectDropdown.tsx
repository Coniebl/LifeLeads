import React, { useState, useRef, useEffect } from "react";

export function SelectDropdown({ 
  value, 
  onChange, 
  options, 
  icon, 
  className,
  dropdownClassName,
  optionClassName,
  activeOptionClassName,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string, value: string, special?: boolean }[];
  icon?: React.ReactNode;
  className?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  activeOptionClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={className}
      >
        <div className="flex items-center gap-2 truncate">
          {icon}
          <span className="truncate">{options.find(o => o.value === value)?.label || value}</span>
        </div>
        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
      </button>

      {isOpen && (
        <div className={dropdownClassName}>
          <div className="max-h-[300px] overflow-y-auto py-1">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={opt.special ? "w-full text-left px-4 py-2.5 text-sm font-bold bg-[#ffc370] text-[#133020] hover:bg-[#ffb347] transition-colors" : (value === opt.value ? activeOptionClassName : optionClassName)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
