import React, { useState } from "react";

interface PortfolioStatusProps {
  stats: {
    totalCompanies: number;
    pendingCount: number;
    acceptedCount: number;
    rejectedCount: number;
    inactiveCount: number;
  };
}

export function PortfolioStatus({ stats }: PortfolioStatusProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const pendingPct = stats.totalCompanies > 0 ? (stats.pendingCount / stats.totalCompanies) * 100 : 0;
  const acceptedPct = stats.totalCompanies > 0 ? (stats.acceptedCount / stats.totalCompanies) * 100 : 0;
  const rejectedPct = stats.totalCompanies > 0 ? (stats.rejectedCount / stats.totalCompanies) * 100 : 0;
  const inactivePct = stats.totalCompanies > 0 ? (stats.inactiveCount / stats.totalCompanies) * 100 : 0;

  return (
    <div className="w-full bg-white dark:bg-[#181512] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-white/5 transition-all">
      <h2 className="text-[13px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-4">
        Offer Status Distribution
      </h2>

      {/* Progress Distribution Bar */}
      <div className="relative w-full h-10 rounded-xl flex overflow-hidden mb-4 bg-gray-100 dark:bg-white/10 group cursor-pointer">
        {stats.totalCompanies > 0 ? (
          <>
            {/* Pending Segment */}
            <div
              className={`bg-[#ffb347] h-full flex items-center justify-center transition-all ${hoveredSegment && hoveredSegment !== 'pending' ? 'opacity-50' : 'opacity-100'}`}
              style={{ width: `${pendingPct}%` }}
              onMouseEnter={() => setHoveredSegment('pending')}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              {pendingPct > 5 && <span className="text-xs font-bold text-[#133020]">{Math.round(pendingPct)}%</span>}
            </div>
            
            {/* Accepted Segment */}
            <div
              className={`bg-[#046241] h-full flex items-center justify-center transition-all ${hoveredSegment && hoveredSegment !== 'accepted' ? 'opacity-50' : 'opacity-100'}`}
              style={{ width: `${acceptedPct}%` }}
              onMouseEnter={() => setHoveredSegment('accepted')}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              {acceptedPct > 5 && <span className="text-xs font-bold text-white">{Math.round(acceptedPct)}%</span>}
            </div>

            {/* Rejected Segment */}
            <div
              className={`bg-[#dc2626] h-full flex items-center justify-center transition-all ${hoveredSegment && hoveredSegment !== 'rejected' ? 'opacity-50' : 'opacity-100'}`}
              style={{ width: `${rejectedPct}%` }}
              onMouseEnter={() => setHoveredSegment('rejected')}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              {rejectedPct > 5 && <span className="text-xs font-bold text-white">{Math.round(rejectedPct)}%</span>}
            </div>

            {/* Not Active Segment */}
            <div
              className={`bg-gray-400 dark:bg-gray-500 h-full flex items-center justify-center transition-all ${hoveredSegment && hoveredSegment !== 'inactive' ? 'opacity-50' : 'opacity-100'}`}
              style={{ width: `${inactivePct}%` }}
              onMouseEnter={() => setHoveredSegment('inactive')}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              {inactivePct > 5 && <span className="text-xs font-bold text-white">{Math.round(inactivePct)}%</span>}
            </div>
          </>
        ) : (
          <div className="bg-gray-200 dark:bg-white/5 w-full h-full flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-400">No data available</span>
          </div>
        )}

        {/* Tooltips */}
        {hoveredSegment === 'pending' && (
          <div className="absolute top-full left-[20%] mt-2 bg-white dark:bg-[#1A1612] border border-gray-100 dark:border-white/5 shadow-xl rounded-lg p-3 z-10">
            <p className="text-xs font-bold text-gray-500 mb-1">Pending Offers</p>
            <p className="text-lg font-black text-[#ffb347]">{stats.pendingCount} <span className="text-xs font-semibold text-gray-400">({pendingPct.toFixed(1)}%)</span></p>
          </div>
        )}
        {hoveredSegment === 'accepted' && (
          <div className="absolute top-full left-[50%] -translate-x-1/2 mt-2 bg-white dark:bg-[#1A1612] border border-gray-100 dark:border-white/5 shadow-xl rounded-lg p-3 z-10">
            <p className="text-xs font-bold text-gray-500 mb-1">Accepted Offers</p>
            <p className="text-lg font-black text-[#046241]">{stats.acceptedCount} <span className="text-xs font-semibold text-gray-400">({acceptedPct.toFixed(1)}%)</span></p>
          </div>
        )}
        {hoveredSegment === 'rejected' && (
          <div className="absolute top-full right-[10%] mt-2 bg-white dark:bg-[#1A1612] border border-gray-100 dark:border-white/5 shadow-xl rounded-lg p-3 z-10">
            <p className="text-xs font-bold text-gray-500 mb-1">Rejected Offers</p>
            <p className="text-lg font-black text-[#dc2626]">{stats.rejectedCount} <span className="text-xs font-semibold text-gray-400">({rejectedPct.toFixed(1)}%)</span></p>
          </div>
        )}
        {hoveredSegment === 'inactive' && (
          <div className="absolute top-full right-[5%] mt-2 bg-white dark:bg-[#1A1612] border border-gray-100 dark:border-white/5 shadow-xl rounded-lg p-3 z-10">
            <p className="text-xs font-bold text-gray-500 mb-1">Not Active</p>
            <p className="text-lg font-black text-gray-500 dark:text-gray-400">{stats.inactiveCount} <span className="text-xs font-semibold text-gray-400">({inactivePct.toFixed(1)}%)</span></p>
          </div>
        )}
      </div>

      {/* Legend below the bar */}
      <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
             onMouseEnter={() => setHoveredSegment('pending')}
             onMouseLeave={() => setHoveredSegment(null)}>
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffb347]" />
          <span>Pending <span className="text-[#133020] dark:text-white ml-0.5">{pendingPct.toFixed(1)}%</span></span>
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
             onMouseEnter={() => setHoveredSegment('accepted')}
             onMouseLeave={() => setHoveredSegment(null)}>
          <span className="w-2.5 h-2.5 rounded-full bg-[#046241]" />
          <span>Accepted <span className="text-[#133020] dark:text-white ml-0.5">{acceptedPct.toFixed(1)}%</span></span>
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
             onMouseEnter={() => setHoveredSegment('rejected')}
             onMouseLeave={() => setHoveredSegment(null)}>
          <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
          <span>Rejected <span className="text-[#133020] dark:text-white ml-0.5">{rejectedPct.toFixed(1)}%</span></span>
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
             onMouseEnter={() => setHoveredSegment('inactive')}
             onMouseLeave={() => setHoveredSegment(null)}>
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500" />
          <span>Not Active <span className="text-[#133020] dark:text-white ml-0.5">{inactivePct.toFixed(1)}%</span></span>
        </div>
      </div>
    </div>
  );
}
