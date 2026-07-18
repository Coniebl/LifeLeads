import React from "react";

export function LogoIcon() {
  return (
    <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hexagon Outer Frame */}
      <polygon points="50,10 90,32 90,78 50,90 10,78 10,32" fill="url(#hex-gold-gradient)" />
      {/* Hexagon Inner Cut */}
      <polygon points="50,18 83,36 83,74 50,83 17,74 17,36" fill="#0F2E1E" className="dark:fill-[#1A1612]" />
      {/* Inner Central Emblem */}
      <polygon points="50,28 75,42 75,68 50,76 25,68 25,42" fill="#ffb347" />
      <defs>
        <linearGradient id="hex-gold-gradient" x1="10" y1="10" x2="90" y2="90">
          <stop offset="0%" stopColor="#ffc370" />
          <stop offset="50%" stopColor="#ffb347" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
    </svg>
  );
}
