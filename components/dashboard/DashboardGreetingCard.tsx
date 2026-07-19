"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDashboardContext } from "../../lib/contexts/DashboardContext";

export function DashboardGreetingCard() {
  const { rawRecords } = useDashboardContext();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  const [displayYear, setDisplayYear] = useState<number | null>(null);
  const [displayMonth, setDisplayMonth] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentTime(now);
    setDisplayYear(now.getFullYear());
    setDisplayMonth(now.getMonth());

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
      const current = new Date();
      setCurrentTime(current);
      setSessionDuration(Math.floor((current.getTime() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const calendarEvents = useMemo(() => {
    if (!rawRecords || displayYear === null || displayMonth === null) return {};
    
    const events: Record<number, { companies: boolean, fcos: boolean }> = {};
    
    rawRecords.forEach(r => {
      if (!r.created_at) return;
      const date = new Date(r.created_at);
      if (date.getFullYear() === displayYear && date.getMonth() === displayMonth) {
        const day = date.getDate();
        if (!events[day]) events[day] = { companies: false, fcos: false };
        
        const name = (r.company_name || "").toLowerCase();
        const isFilipino = name.includes("filipino") || name.includes("community") || name.includes("association") || name.includes("org") || name.includes("federation");
        const category = r.category || (isFilipino ? "Filipino Community Organizations" : "Companies");
        
        if (category === "Filipino Community Organizations") {
          events[day].fcos = true;
        } else {
          events[day].companies = true;
        }
      }
    });
    return events;
  }, [rawRecords, displayYear, displayMonth]);

  if (!currentTime || displayMonth === null || displayYear === null) return null; // Avoid hydration mismatch

  const hours = currentTime.getHours();
  let greeting = "Good Evening";
  if (hours < 12) greeting = "Good Morning";
  else if (hours < 18) greeting = "Good Afternoon";

  const sessionH = Math.floor(sessionDuration / 3600);
  const sessionM = Math.floor((sessionDuration % 3600) / 60);
  const sessionS = sessionDuration % 60;
  const sessionString = `${sessionH > 0 ? `${sessionH}h ` : ''}${sessionM}m ${sessionS}s`;

  // Calendar logic
  const todayYear = currentTime.getFullYear();
  const todayMonth = currentTime.getMonth();
  const todayDate = currentTime.getDate();

  const firstDay = new Date(displayYear, displayMonth, 1).getDay();
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  const handlePrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  return (
    <div className="relative w-full rounded-[32px] overflow-hidden bg-black text-white shadow-2xl mb-8 min-h-[360px] flex items-center dark:border dark:border-[#046241] dark:shadow-[0_0_20px_rgba(4,98,65,0.6)]">
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
                {(displayMonth + 1).toString().padStart(2, '0')} \ {displayYear}
              </p>
              <h3 className="text-2xl font-black text-white">{monthNames[displayMonth]}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <button onClick={handleNextMonth} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center mb-4">
            {days.map(d => (
              <div key={d} className="text-[10px] font-black text-[#ccff00]">{d}</div>
            ))}
            {calendarCells.map((day, idx) => {
              const isToday = day === todayDate && displayMonth === todayMonth && displayYear === todayYear;
              
              return (
                <div key={idx} className="relative flex items-center justify-center h-8">
                  {day && (
                    <span className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-lg ${
                      isToday 
                        ? 'border border-[#ccff00] text-[#ccff00] bg-[#ccff00]/10' 
                        : 'text-gray-300'
                    }`}>
                      {day}
                    </span>
                  )}
                  {/* Decorative dots from data */}
                  {day && calendarEvents[day] && (
                    <div className="absolute -bottom-1 flex gap-0.5">
                      {calendarEvents[day].companies && <span className="w-1 h-1 rounded-full bg-[#ccff00]"></span>}
                      {calendarEvents[day].fcos && <span className="w-1 h-1 rounded-full bg-[#ffb347]"></span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]"></span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Companies</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb347]"></span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Community Orgs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
