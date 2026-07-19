import React from "react";

export function LifeLeadLogo() {
  return (
    <div className="flex items-center gap-5 select-none">
      {/* Lifewood Logo Image */}
      <img
        src="/lifewood-logo.png"
        alt="Lifewood Logo"
        className="h-[26px] w-auto object-contain shrink-0"
      />

      {/* LIFELEADS Logo Image (Perfectly framed: scaled, left-cropped to hide glass but keep L and P, taller container to keep bottom text) */}
      <div className="overflow-hidden flex items-center h-[38px] shrink-0">
        <img
          src="/lifeleads-logo.png"
          alt="LifeLead Logo"
          className="max-w-none"
          style={{ 
            height: '66px', 
            marginLeft: '-57px' 
          }}
        />
      </div>
    </div>
  );
}
