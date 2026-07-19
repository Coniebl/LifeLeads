import React from "react";

interface SummaryCardsProps {
  stats: {
    totalLeads: number;
    totalCountries: number;
    totalIndustries: number;
    acceptedOfferCount: number;
  };
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Total Leads Card */}
      <div className="bg-white dark:bg-[#181512] rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-white/5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Leads</span>
          <span className="p-1.5 rounded-lg bg-[#046241]/10 text-[#046241] dark:bg-[#ffb347]/10 dark:text-[#ffb347]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </span>
        </div>
        <div>
          <div className="text-3xl font-black tracking-tight text-[#133020] dark:text-white leading-none mb-1">
            {stats.totalLeads}
          </div>
          <div className="text-xs text-gray-400">across all companies</div>
        </div>
      </div>

      {/* Total Countries Card */}
      <div className="bg-white dark:bg-[#181512] rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-white/5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Countries</span>
          <span className="p-1.5 rounded-lg bg-[#ffb347]/15 text-[#ffb347]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
            </svg>
          </span>
        </div>
        <div>
          <div className="text-3xl font-black tracking-tight text-[#133020] dark:text-white leading-none mb-1">
            {stats.totalCountries}
          </div>
          <div className="text-xs text-gray-400">active regions</div>
        </div>
      </div>

      {/* Industry Types Card */}
      <div className="bg-white dark:bg-[#181512] rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-white/5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Industry Types</span>
          <span className="p-1.5 rounded-lg bg-[#ffc370]/15 text-[#ffc370]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 18.4v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.453.25-.718.25H4.875a1.03 1.03 0 01-.718-.25m16.5 0a34.705 34.705 0 01-3.037.404M3.75 14.15a2.18 2.18 0 01-.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.11 48.11 0 013.413-.387m-4.5 8.006c.194.165.453.25.718.25h14.25c.265 0 .524-.085.718-.25m-16.5 0a34.29 34.29 0 003.037.404m0 0a34.78 34.78 0 0110.898 0m-10.898 0l-.823-5.58H18.5l-.823 5.58M12 9.75v.008M12 12.75v.008M12 15.75v.008" />
            </svg>
          </span>
        </div>
        <div>
          <div className="text-3xl font-black tracking-tight text-[#133020] dark:text-white leading-none mb-1">
            {stats.totalIndustries}
          </div>
          <div className="text-xs text-gray-400">sectors monitored</div>
        </div>
      </div>

      {/* Accepted Offer Card */}
      <div className="bg-white dark:bg-[#181512] rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-white/5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Accepted Offer</span>
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </span>
        </div>
        <div>
          <div className="text-3xl font-black tracking-tight text-[#133020] dark:text-white leading-none mb-1">
            {stats.acceptedOfferCount}
          </div>
          <div className="text-xs text-gray-400">companies on-boarded</div>
        </div>
      </div>
    </div>
  );
}
