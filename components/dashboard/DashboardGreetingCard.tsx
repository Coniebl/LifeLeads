"use client";

import React, { useState, useEffect } from "react";

export function DashboardGreetingCard() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  useEffect(() => {
    setCurrentTime(new Date());

    // Session tracking
    const sessionStartStr = sessionStorage.getItem("sessionStart");
    let startTime: number;
    if (sessionStartStr) {
      startTime = parseInt(sessionStartStr, 10);
    } else {
      startTime = Date.now();
      sessionStorage.setItem("sessionStart", startTime.toString());
    }

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setSessionDuration(Math.floor((now.getTime() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!currentTime) return null; // Avoid hydration mismatch

  const hours = currentTime.getHours();
  let greeting = "Good Evening";
  if (hours < 12) greeting = "Good Morning";
  else if (hours < 18) greeting = "Good Afternoon";

  const sessionH = Math.floor(sessionDuration / 3600);
  const sessionM = Math.floor((sessionDuration % 3600) / 60);
  const sessionS = sessionDuration % 60;
  const sessionString = `${sessionH > 0 ? `${sessionH}h ` : ''}${sessionM}m ${sessionS}s`;

  // Calendar logic
  const year = currentTime.getFullYear();
  const month = currentTime.getMonth();
  const date = currentTime.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  // Generate calendar grid
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  return (
    <div className="relative w-full rounded-[32px] overflow-hidden bg-black text-white shadow-2xl mb-8 min-h-[360px] flex items-center">
      {/* Background Video */}
      <video 
        src="/background video.mp4" 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover invert opacity-80"
      />
      
      {/* Overlay to ensure text readability if needed */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80"></div>

      <div className="relative z-10 w-full p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Greeting & Session */}
        <div className="flex flex-col flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 w-max mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-widest text-[#ccff00]">Active Session</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-2">
            {greeting},<br/>
            <span className="text-[#ccff00]">Admin.</span>
          </h2>
          
          <p className="text-gray-300 font-medium text-lg mb-8 max-w-md">
            Ready to track today's progress and manage your leads?
          </p>

          <div className="flex items-center gap-8 border-t border-white/10 pt-6 mt-auto">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Session Duration</p>
              <p className="text-2xl font-bold text-white font-mono">{sessionString}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Time</p>
              <p className="text-2xl font-bold text-white font-mono">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Calendar UI */}
        <div className="w-full max-w-[340px] bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                {(month + 1).toString().padStart(2, '0')} \ {year}
              </p>
              <h3 className="text-2xl font-black text-white">{monthNames[month]}</h3>
            </div>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center mb-4">
            {days.map(d => (
              <div key={d} className="text-[10px] font-black text-[#ccff00]">{d}</div>
            ))}
            {calendarCells.map((day, idx) => (
              <div key={idx} className="relative flex items-center justify-center h-8">
                {day && (
                  <span className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-lg ${
                    day === date 
                      ? 'border border-[#ccff00] text-[#ccff00] bg-[#ccff00]/10' 
                      : 'text-gray-300'
                  }`}>
                    {day}
                  </span>
                )}
                {/* Decorative dots for sample effect */}
                {day && (day % 4 === 0) && day !== date && (
                  <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[#ccff00]"></span>
                )}
                {day === date && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#ccff00]"></span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]"></span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Start Date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]"></span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Deadline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
