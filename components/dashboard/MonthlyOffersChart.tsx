import React from "react";

interface MonthlyOffersChartProps {
  selectedFile: string;
  hasData?: boolean;
  monthlyData: number[];
}

export function MonthlyOffersChart({ selectedFile, hasData = true, monthlyData }: MonthlyOffersChartProps) {
  // Mock data for the 12 months (0-100 scale for simplicity)
  // Dynamic behavior based on selectedFile (just slightly varying points for demonstration)
  const getPoints = () => {
    if (!hasData || !monthlyData || monthlyData.length !== 12) return Array(12).fill(0);
    return monthlyData;
  };

  const data = getPoints();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // SVG viewBox size
  const svgWidth = 800;
  const svgHeight = 300;
  const paddingX = 40;
  const paddingY = 40;
  
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;
  
  const maxDataVal = Math.max(...data, 10);
  // Round up to nearest 10, minimum 10
  const maxVal = Math.ceil(maxDataVal / 10) * 10;

  // Helper to calculate X and Y coordinates
  const getX = (index: number) => paddingX + (index * (innerWidth / (data.length - 1)));
  const getY = (val: number) => paddingY + innerHeight - ((val / maxVal) * innerHeight);

  // Generate SVG path for smooth line
  const generatePath = () => {
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

  return (
    <div className="w-full h-full bg-white dark:bg-[#181512] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-white/5 flex flex-col transition-all">
      <div className="mb-4">
        <h2 className="text-[13px] font-black text-gray-500 tracking-widest uppercase mb-1">
          Monthly Accepted Offers
        </h2>
        <p className="text-sm font-bold text-gray-400">
          Tracking: <span className="text-[#046241] dark:text-[#ffb347]">{selectedFile}</span>
        </p>
      </div>

      <div className="flex-1 relative w-full h-full min-h-[250px]">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
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

          {/* Smooth Line */}
          <path
            d={generatePath()}
            fill="none"
            stroke="#046241"
            strokeWidth={3}
            className="drop-shadow-sm dark:stroke-[#4ade80]"
          />

          {/* Data Points */}
          {data.map((val, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(val)}
              r={4}
              fill="#046241"
              stroke="#fff"
              strokeWidth={2}
              className="dark:fill-[#4ade80] dark:stroke-[#181512]"
            />
          ))}

          {/* X Axis Labels */}
          {months.map((month, i) => (
            <text
              key={i}
              x={getX(i)}
              y={svgHeight - 10}
              textAnchor="middle"
              className="text-[10px] font-bold fill-gray-400"
            >
              {month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
