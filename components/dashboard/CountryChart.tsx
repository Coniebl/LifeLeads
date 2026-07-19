import React, { useState } from "react";
import type { CountryData } from "../../lib/hooks/useDashboardData";

interface CountryChartProps {
  countriesData: Record<string, CountryData>;
}

export function CountryChart({ countriesData }: CountryChartProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{ name: string; item: CountryData; x: number; y: number } | null>(null);

  const countries = Object.entries(countriesData).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="w-full bg-white dark:bg-[#181512] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-white/5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-extrabold text-[#133020] dark:text-white">
            Companies per Country
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Hover a bar to see the companies in that country
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs font-bold text-gray-500 dark:text-gray-400">
          {countries.slice(0, 10).map(([name, item]) => (
            <div key={name} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="truncate max-w-[80px]">{name}</span>
            </div>
          ))}
          {countries.length > 10 && <span className="text-[10px] text-gray-400">+{countries.length - 10} more</span>}
        </div>
      </div>

      {/* SVG Visual Bar Chart Container */}
      {countries.length === 0 ? (
        <div className="w-full h-72 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-sm text-gray-400 dark:text-gray-500 gap-1.5 p-6 mb-8 select-none">
          <svg className="w-8 h-8 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold text-[13px]">No database record found</span>
          <p className="text-xs text-gray-400 text-center max-w-[280px]">
            Add rows to <code className="bg-gray-100 dark:bg-white/5 px-1 py-0.5 rounded text-red-500 font-mono text-[10px]">records</code> in Supabase, or import an Excel file to populate.
          </p>
        </div>
      ) : (
        <div className="w-full pb-8">
          <div className="relative h-72 border-b border-gray-100 dark:border-white/5 flex items-end justify-between gap-1 sm:gap-2 px-1 sm:px-4 select-none w-full">
            {countries.map(([name, item]) => {
              const maxVal = Math.max(...countries.map(c => c[1].count), 8);
              const heightPercent = `${Math.max((item.count / maxVal) * 100, 2)}%`;
              const isHovered = hoveredCountry === name;

              return (
                <div
                  key={name}
                  className="relative flex flex-col items-center flex-1 min-w-[20px] max-w-[64px] group cursor-pointer h-full justify-end"
                  onMouseEnter={() => setHoveredCountry(name)}
                  onMouseMove={(e) => {
                    setTooltipData({ name, item, x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => {
                    setHoveredCountry(null);
                    setTooltipData(null);
                  }}
                >
                  {/* Top Label (Count) */}
                  <span className={`text-[10px] sm:text-sm font-black mb-2 transition-all ${isHovered ? "text-[#133020] dark:text-white scale-110" : "text-gray-400"}`}>
                    {item.count}
                  </span>

                  {/* Bar */}
                  <div
                    style={{ height: heightPercent }}
                    className={`w-full rounded-t-xl transition-all duration-300 relative ${
                      isHovered
                        ? `${item.color} brightness-95 scale-x-105 shadow-[0_4px_15px_rgba(4,98,65,0.15)]`
                        : `${item.color} opacity-80`
                    }`}
                  />
                  
                  {/* Bottom Label (Country) */}
                  <span className="absolute top-full mt-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 text-center w-14 sm:w-24 truncate px-0.5">
                    {name}
                  </span>
                </div>
              );
            })}

            {/* Horizontal Gridlines (Visual helpers) */}
            <div className="absolute left-0 w-full h-0 border-t border-dashed border-gray-100 dark:border-white/5 top-[25%] -z-10" />
            <div className="absolute left-0 w-full h-0 border-t border-dashed border-gray-100 dark:border-white/5 top-[50%] -z-10" />
            <div className="absolute left-0 w-full h-0 border-t border-dashed border-gray-100 dark:border-white/5 top-[75%] -z-10" />
          </div>
        </div>
      )}

      {/* Floating Cursor Tooltip */}
      {tooltipData && (
        <div 
          className="fixed z-[999] bg-white dark:bg-[#1A1612] border border-gray-100 dark:border-white/5 shadow-2xl rounded-2xl p-4 w-56 text-left pointer-events-none transition-opacity duration-150"
          style={{ 
            left: Math.min(tooltipData.x + 15, window.innerWidth - 240), 
            top: Math.min(tooltipData.y + 15, window.innerHeight - 200) 
          }}
        >
          <h4 className="text-xs font-extrabold text-[#133020] dark:text-[#ffb347] uppercase tracking-wider mb-2 border-b border-gray-100 dark:border-white/5 pb-1">
            {tooltipData.name} ({tooltipData.item.count})
          </h4>
          <div className="flex flex-col gap-1.5 text-xs text-gray-500 dark:text-gray-300 max-h-48 overflow-y-auto custom-scrollbar">
            {tooltipData.item.companies.length > 0 ? (
              tooltipData.item.companies.map((companyName, idx) => (
                <div key={idx} className="flex items-center gap-2 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#046241] flex-shrink-0" />
                  <span className="truncate">{companyName}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-400 italic">No companies listed</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
