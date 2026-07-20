"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDashboardContext } from "../../lib/contexts/DashboardContext";

export function DashboardGreetingCard() {
  const { rawRecords, user } = useDashboardContext();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [isGlitching, setIsGlitching] = useState(false);

  const [displayYear, setDisplayYear] = useState<number | null>(null);
  const [displayMonth, setDisplayMonth] = useState<number | null>(null);
  const [localExports, setLocalExports] = useState<any[]>([]);
  const [localDeletedImports, setLocalDeletedImports] = useState<any[]>([]);

  useEffect(() => {
    const now = new Date();
    setCurrentTime(now);
    setDisplayYear(now.getFullYear());
    setDisplayMonth(now.getMonth());

    // Session tracking
    const getLocalDayStr = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const todayStr = getLocalDayStr(new Date());
    let savedDate = localStorage.getItem("lifelead_session_date");
    let currentDuration = parseInt(localStorage.getItem("lifelead_session_duration") || "0", 10);

    if (savedDate !== todayStr) {
      currentDuration = 0;
      localStorage.setItem("lifelead_session_date", todayStr);
      localStorage.setItem("lifelead_session_duration", "0");
    }
    
    setSessionDuration(currentDuration);

    const interval = setInterval(() => {
      const current = new Date();
      setCurrentTime(current);
      
      const currentDayStr = getLocalDayStr(current);
      if (localStorage.getItem("lifelead_session_date") !== currentDayStr) {
        currentDuration = 0;
        localStorage.setItem("lifelead_session_date", currentDayStr);
      }
      
      currentDuration += 1;
      localStorage.setItem("lifelead_session_duration", currentDuration.toString());
      setSessionDuration(currentDuration);
    }, 1000);

    const loadLocalData = () => {
      try {
        setLocalExports(JSON.parse(localStorage.getItem('lifelead_exports') || '[]'));
        setLocalDeletedImports(JSON.parse(localStorage.getItem('lifelead_deleted_imports') || '[]'));
      } catch (e) {}
    };
    loadLocalData();
    window.addEventListener('lifelead_export', loadLocalData);
    window.addEventListener('lifelead_deleted_import', loadLocalData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('lifelead_export', loadLocalData);
      window.removeEventListener('lifelead_deleted_import', loadLocalData);
    };
  }, []);

  const calendarEvents = useMemo(() => {
    if (!rawRecords || displayYear === null || displayMonth === null) return {};
    
    const events: Record<number, { imports: { companies: number, fcos: number }, exports: { companies: number, fcos: number } }> = {};
    
    // Process current live records
    rawRecords.forEach(r => {
      if (!r.created_at) return;
      const date = new Date(r.created_at);
      if (date.getFullYear() === displayYear && date.getMonth() === displayMonth) {
        const day = date.getDate();
        if (!events[day]) events[day] = { imports: { companies: 0, fcos: 0 }, exports: { companies: 0, fcos: 0 } };
        
        const category = r.category || "Companies";
        if (category === "Filipino Community Organizations") {
          events[day].imports.fcos += 1;
        } else {
          events[day].imports.companies += 1;
        }
      }
    });

    // Process deleted imports to restore their counts on the calendar
    localDeletedImports.forEach(di => {
      if (!di.date) return;
      const date = new Date(di.date);
      if (date.getFullYear() === displayYear && date.getMonth() === displayMonth) {
        const day = date.getDate();
        if (!events[day]) events[day] = { imports: { companies: 0, fcos: 0 }, exports: { companies: 0, fcos: 0 } };
        
        if (di.category === "Filipino Community Organizations") {
          events[day].imports.fcos += 1;
        } else {
          events[day].imports.companies += 1;
        }
      }
    });

    // Process exports
    localExports.forEach((ex: any) => {
      const date = new Date(ex.date);
      if (date.getFullYear() === displayYear && date.getMonth() === displayMonth) {
        const day = date.getDate();
        if (!events[day]) events[day] = { imports: { companies: 0, fcos: 0 }, exports: { companies: 0, fcos: 0 } };

        if (ex.category === "Filipino Community Organizations") {
          events[day].exports.fcos += ex.count;
        } else {
          events[day].exports.companies += ex.count;
        }
      }
    });

    return events;
  }, [rawRecords, displayYear, displayMonth, localExports, localDeletedImports]);

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

  const firstName = user?.name ? user.name.split(' ')[0] : "Admin";

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
            <span 
              className="inline-block relative cursor-pointer text-[#ccff00]"
              onMouseEnter={() => setIsGlitching(true)}
              onMouseLeave={() => setIsGlitching(false)}
            >
              <span 
                className={`glitch-idle-active ${isGlitching ? "opacity-0" : "opacity-100 transition-opacity duration-200"}`}
                data-text={`${user?.role === 'admin' ? 'Admin' : 'User'}.`}
              >
                {user?.role === 'admin' ? 'Admin' : 'User'}.
              </span>
              {isGlitching && (
                <span className="absolute top-0 left-0 pointer-events-none whitespace-nowrap z-10">
                  <span className="glitch-active inline-block" data-text={firstName}>{firstName}</span>
                </span>
              )}
            </span>
          </h2>
          
          <p className="text-gray-300 font-medium text-lg mb-8 max-w-md">
            Ready to track Lifewood's potential clients and secure partnerships?
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
                <div key={idx} className="relative flex items-center justify-center h-8 group cursor-default">
                  {day && (
                    <span className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-lg transition-colors ${
                      isToday 
                        ? 'border border-[#ccff00] text-[#ccff00] bg-[#ccff00]/10 hover:bg-[#ccff00]/20' 
                        : 'text-gray-300 hover:bg-white/5'
                    }`}>
                      {day}
                    </span>
                  )}
                  {/* Hover Tooltip */}
                  {day && calendarEvents[day] && (
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col z-50 min-w-[140px] p-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl text-left pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-white/10 pb-1.5 mb-1.5">
                        {monthNames[displayMonth]} {day}, {displayYear}
                      </p>
                      <div className="text-xs font-bold text-[#ccff00]">+ {calendarEvents[day].imports.companies} Companies Imp.</div>
                      <div className="text-xs font-bold text-[#ffb347]">+ {calendarEvents[day].imports.fcos} Orgs Imp.</div>
                      <div className="text-xs font-bold text-[#3b82f6]">- {calendarEvents[day].exports.companies} Companies Exp.</div>
                      <div className="text-xs font-bold text-[#ec4899]">- {calendarEvents[day].exports.fcos} Orgs Exp.</div>
                    </div>
                  )}
                  {/* Decorative dots from data */}
                  {day && calendarEvents[day] && (
                    <div className="absolute -bottom-1 flex flex-wrap justify-center gap-0.5 px-1 w-full pointer-events-none">
                      <span className="w-1 h-1 rounded-full bg-[#ccff00]"></span>
                      <span className="w-1 h-1 rounded-full bg-[#ffb347]"></span>
                      <span className="w-1 h-1 rounded-full bg-[#3b82f6]"></span>
                      <span className="w-1 h-1 rounded-full bg-[#ec4899]"></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-y-2 mt-6 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-x-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]"></span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Imp. Companies</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb347]"></span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Imp. Orgs</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Exp. Companies</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899]"></span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Exp. Orgs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
