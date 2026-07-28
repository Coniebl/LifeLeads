"use client";

import React, { ReactNode, Suspense, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardProvider, useDashboardContext } from "../../lib/contexts/DashboardContext";

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const {
    user,
    isDarkMode,
    setIsDarkMode,
    activeTab,
    setActiveTab,
    handleLogout,
  } = useDashboardContext();

  const [showIdleModal, setShowIdleModal] = useState(false);
  const [remainingTime, setRemainingTime] = useState(1200);

  useEffect(() => {
    let lastActivity = Date.now();
    
    const updateActivity = () => {
      lastActivity = Date.now();
      setShowIdleModal(prev => {
        if (prev) return false;
        return prev;
      });
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    const intervalId = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      
      const TEN_MINS = 10 * 60 * 1000;
      const THIRTY_MINS = 30 * 60 * 1000;

      if (idleTime >= THIRTY_MINS) {
        handleLogout();
      } else if (idleTime >= TEN_MINS) {
        setShowIdleModal(prev => (!prev ? true : prev));
        setRemainingTime(Math.floor((THIRTY_MINS - idleTime) / 1000));
      } else {
        setShowIdleModal(prev => (prev ? false : prev));
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <main className="h-screen w-full flex overflow-hidden bg-[#f5eedb] dark:bg-[#0d0b09] transition-colors duration-300 font-sans">
      <Suspense fallback={<div className="h-full bg-[#0F2E1E] dark:bg-[#14120e] w-20 flex-shrink-0 z-30 transition-all duration-300" />}>
        <Sidebar
          user={user}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
        />
      </Suspense>
      <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 transition-all duration-300 bg-[#f5eedb] dark:bg-[#0d0b09]">
        {children}
      </div>

      {/* Idle Modal */}
      {showIdleModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1a1714] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-[#133020] dark:text-white mb-2">Are you still there?</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
              You've been idle for a while. For your security, you will be automatically logged out in:
            </p>
            <div className="text-4xl font-black text-red-600 dark:text-red-500 mb-8 font-mono tracking-tight">
              {formatTime(remainingTime)}
            </div>
            <button 
              className="w-full py-3.5 bg-[#046241] hover:bg-[#133020] dark:bg-[#4ade80] dark:hover:bg-[#2dd4bf] dark:text-[#133020] text-white rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Continue Session
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
