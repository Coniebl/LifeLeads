import React, { useState } from "react";
import type { IndustryData } from "../../lib/hooks/useDashboardData";

interface IndustryChartProps {
  industriesData: Record<string, IndustryData>;
}

export function IndustryChart({ industriesData }: IndustryChartProps) {
  return (
    <div className="w-full bg-white dark:bg-[#181512] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-white/5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-extrabold text-[#133020] dark:text-white">
            Companies by General Industry
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Total distinct companies per general industry type
          </p>
        </div>
      </div>

      {Object.keys(industriesData).length === 0 ? (
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
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
            {Object.entries(industriesData).map(([name, item]) => (
              <div key={name} className="py-4 flex flex-col items-center border border-gray-100 dark:border-white/5 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="text-2xl font-black text-[#133020] dark:text-white leading-none mb-1">
                  {item.count}
                </div>
                <div className="text-[13px] font-bold text-gray-600 dark:text-gray-300">{name}</div>
                <div className="text-[10px] text-gray-400 mt-1 px-2 py-0.5 rounded-full bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5">
                  {item.percentage}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
