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
        <div className="flex items-center gap-2 whitespace-normal break-words text-left">
          {icon}
          <span className="whitespace-normal break-words text-left">{options.find(o => o.value === value)?.label || value}</span>
        </div>
        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
      </button>

      {isOpen && (
        <div className={dropdownClassName}>
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden py-1">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(opt.value);
                  // Delay closing the dropdown slightly to prevent the click event from 
                  // "falling through" and triggering the onClick of elements underneath it
                  setTimeout(() => setIsOpen(false), 50);
                }}
                className={opt.special ? "w-full text-left px-4 py-2.5 text-sm font-bold bg-[#ffc370] text-[#133020] hover:bg-[#ffb347] transition-colors whitespace-normal break-words" : `${value === opt.value ? activeOptionClassName : optionClassName} whitespace-normal break-words`}
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
