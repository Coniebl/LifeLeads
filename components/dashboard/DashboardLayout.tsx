"use client";

import React, { ReactNode, Suspense } from "react";
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
