import React, { useState } from "react";

interface MonthlyOffersChartProps {
  selectedFile: string;
  hasData?: boolean;
  monthlyAccepted: number[];
  monthlyRejected: number[];
}

export function MonthlyOffersChart({ selectedFile, hasData = true, monthlyAccepted, monthlyRejected }: MonthlyOffersChartProps) {
  const [tooltipData, setTooltipData] = useState<{ month: string; accepted: number; rejected: number; x: number; y: number } | null>(null);

  const getPoints = (dataArray: number[]) => {
    if (!hasData || !dataArray || dataArray.length !== 12) return Array(12).fill(0);
    return dataArray;
  };

  const acceptedData = getPoints(monthlyAccepted);
  const rejectedData = getPoints(monthlyRejected);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // SVG viewBox size
  const svgWidth = 800;
  const svgHeight = 300;
  const paddingX = 40;
  const paddingY = 40;
  
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;
  
  const maxDataVal = Math.max(...acceptedData, ...rejectedData, 10);
  const maxVal = Math.ceil(maxDataVal / 10) * 10;

  // Helper to calculate X and Y coordinates
  const getX = (index: number) => paddingX + (index * (innerWidth / (11)));
  const getY = (val: number) => paddingY + innerHeight - ((val / maxVal) * innerHeight);

  // Generate SVG path for smooth line
  const generatePath = (data: number[]) => {
    let d = `M ${getX(0)} ${getY(data[0])}`;
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = getX(i);
      const y1 = getY(data[i]);
      const x2 = getX(i + 1);
      const y2 = getY(data[i + 1]);
      
      const cp1X = x1 + (x2 - x1) / 3;
      const cp2X = x2 - (x2 - x1) / 3;
      
      d += ` C ${cp1X} ${y1}, ${cp2X} ${y2}, ${x2} ${y2}`;
    }
    return d;
  };

  const generateArea = (data: number[]) => {
    const linePath = generatePath(data);
    return `${linePath} L ${getX(data.length - 1)} ${paddingY + innerHeight} L ${getX(0)} ${paddingY + innerHeight} Z`;
  };

  return (
    <div className="w-full h-full bg-white dark:bg-[#181512] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-white/5 flex flex-col transition-all">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-black text-gray-500 tracking-widest uppercase mb-1">
            Offers Status (Accepted vs Rejected)
          </h2>
          <p className="text-sm font-bold text-gray-400">
            Tracking: <span className="text-[#046241] dark:text-[#ffb347]">{selectedFile}</span>
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#046241]"></span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Accepted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ffb347]"></span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rejected</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full min-h-[250px]">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
          
          <defs>
            <linearGradient id="acceptedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#046241" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#046241" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rejectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffb347" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ffb347" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal].map((tick) => (
            <g key={tick}>
              <line
                x1={paddingX}
                y1={getY(tick)}
                x2={svgWidth - paddingX}
                y2={getY(tick)}
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-gray-200 dark:text-white/10"
                strokeWidth={1}
              />
              <text
                x={paddingX - 10}
                y={getY(tick) + 4}
                textAnchor="end"
                className="text-[10px] font-bold fill-gray-400"
              >
                {Math.round(tick)}
              </text>
            </g>
          ))}

          {/* Rejected Area & Line */}
          <path
            d={generateArea(rejectedData)}
            fill="url(#rejectedGradient)"
            className="transition-all"
          />
          <path
            d={generatePath(rejectedData)}
            fill="none"
            stroke="#ffb347"
            strokeWidth={3}
            className="drop-shadow-sm"
          />

          {/* Accepted Area & Line */}
          <path
            d={generateArea(acceptedData)}
            fill="url(#acceptedGradient)"
            className="transition-all"
          />
          <path
            d={generatePath(acceptedData)}
            fill="none"
            stroke="#046241"
            strokeWidth={3}
            className="drop-shadow-sm dark:stroke-[#4ade80]"
          />

          {/* Invisible interactive overlay to catch mouse movements for tooltips */}
          {months.map((month, i) => (
            <rect
              key={i}
              x={i === 0 ? 0 : getX(i) - (innerWidth / 22)}
              y={0}
              width={i === 0 || i === 11 ? paddingX + (innerWidth / 22) : innerWidth / 11}
              height={svgHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={(e) => {
                setTooltipData({ month, accepted: acceptedData[i], rejected: rejectedData[i], x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                setTooltipData({ month, accepted: acceptedData[i], rejected: rejectedData[i], x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => {
                setTooltipData(null);
              }}
            />
          ))}

          {/* X Axis Labels */}
          {months.map((month, i) => (
            <text
              key={i}
              x={getX(i)}
              y={svgHeight - 10}
              textAnchor="middle"
              className="text-[10px] font-bold fill-gray-400 pointer-events-none"
            >
              {month}
            </text>
          ))}
          
          {/* Active Data Points Overlay (shows when hovering a vertical slice) */}
          {tooltipData && (
            <>
              {/* Vertical guideline */}
              <line 
                x1={getX(months.indexOf(tooltipData.month))} 
                y1={paddingY} 
                x2={getX(months.indexOf(tooltipData.month))} 
                y2={paddingY + innerHeight} 
                stroke="#d1d5db" 
                strokeDasharray="4 4" 
                className="dark:stroke-gray-700 pointer-events-none" 
              />
              {/* Points */}
              <circle cx={getX(months.indexOf(tooltipData.month))} cy={getY(tooltipData.rejected)} r={6} fill="#ffb347" stroke="#fff" strokeWidth={2} className="dark:stroke-[#181512] pointer-events-none" />
              <circle cx={getX(months.indexOf(tooltipData.month))} cy={getY(tooltipData.accepted)} r={6} fill="#046241" stroke="#fff" strokeWidth={2} className="dark:fill-[#4ade80] dark:stroke-[#181512] pointer-events-none" />
            </>
          )}

        </svg>
      </div>

      {/* Floating Cursor Tooltip */}
      {tooltipData && (
        <div 
          className="fixed z-[999] bg-white dark:bg-[#1A1612] border border-gray-100 dark:border-white/5 shadow-2xl rounded-xl p-3 w-48 text-left pointer-events-none transition-opacity duration-150"
          style={{ 
            left: Math.min(tooltipData.x + 15, window.innerWidth - 200), 
            top: Math.min(tooltipData.y + 15, window.innerHeight - 120) 
          }}
        >
          <div className="text-xs font-bold text-gray-400 mb-2 tracking-wider uppercase border-b border-gray-100 dark:border-white/5 pb-2">{tooltipData.month}</div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-black text-[#046241] dark:text-[#4ade80]">Accepted</span>
            <span className="text-sm font-black text-[#133020] dark:text-white">{tooltipData.accepted}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-[#ffb347]">Rejected</span>
            <span className="text-sm font-black text-[#133020] dark:text-white">{tooltipData.rejected}</span>
          </div>
        </div>
      )}
    </div>
  );
}
