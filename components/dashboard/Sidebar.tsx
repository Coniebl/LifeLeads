"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { DashboardUser } from "../../lib/hooks/useDashboardData";

interface SidebarProps {
  user: DashboardUser | null;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  handleLogout: () => void;
}

export function Sidebar({
  user,
  isDarkMode,
  setIsDarkMode,
  activeTab,
  setActiveTab,
  handleLogout,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "Companies";
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      const saved = localStorage.getItem("lifelead-sidebar-expanded");
      if (saved !== null) {
        setIsExpanded(saved === "true");
      } else {
        setIsExpanded(true); // default expanded
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    localStorage.setItem("lifelead-sidebar-expanded", String(nextState));
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    {
      name: "Dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      name: "Leads",
      label: "Leads",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      name: "Status",
      label: "Status",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5.25H7.5A2.25 2.25 0 005.25 7.5v11.25A2.25 2.25 0 007.5 21h9a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H15M9 5.25A2.25 2.25 0 0011.25 3h1.5A2.25 2.25 0 0115 5.25M9 5.25A2.25 2.25 0 0011.25 7.5h1.5A2.25 2.25 0 0015 5.25m-5.25 7.5l1.5 1.5 3-3" />
        </svg>
      ),
    },
    {
      name: "Records",
      label: "Records",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className={`h-full bg-[#0F2E1E] dark:bg-[#14120e] border-r border-[#0F2E1E] dark:border-[#14120e] ${isExpanded ? "w-64" : "w-20"} flex flex-col justify-between py-6 select-none text-white flex-shrink-0 z-30 transition-all duration-300`}>
      {/* Top Branding Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 px-3 relative border-b border-white/5 pb-3">
          <div className="flex items-center justify-center bg-black/20 dark:bg-white/5 rounded-2xl border border-white/5 overflow-hidden px-1 py-1 h-14 w-full transition-all duration-300">
            {isExpanded ? (
              <img 
                src="/new-top-logo.png" 
                alt="LifeLeads Logo" 
                className="w-full h-full object-contain scale-[1.4] transition-all duration-300"
              />
            ) : (
              <img 
                src="/magnify.png" 
                alt="LifeLeads Logo Icon" 
                className="h-full w-full object-contain scale-[2.5] transition-all duration-300"
              />
            )}
          </div>

          {/* Toggle button placed below the logo */}
          <div className="flex justify-center w-full transition-all duration-300">
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center gap-2 p-1 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
              title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
              aria-label={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isExpanded && <span className="text-xs font-light tracking-wide">Collapse</span>}
              <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Nav Menu Links */}
        <div className="flex flex-col gap-1.5 px-3">
          {navItems.map((item) => {
            let isActive = false;
            if (item.name === "Leads") isActive = pathname === "/leads" || pathname === "/companies";
            else if (item.name === "Dashboard") isActive = pathname === "/dashboard" || pathname === "/";
            else if (item.name === "Status") isActive = pathname === "/status";
            else if (item.name === "Records") isActive = pathname === "/records";

            const hasSubcategories = item.name === "Leads" || item.name === "Status";

            return (
              <div key={item.name} className="flex flex-col">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isExpanded) setIsExpanded(true); // Auto-expand when clicking a nav item if closed
                    
                    if (item.name === "Leads") router.push(`/leads?category=${category}`);
                    else if (item.name === "Dashboard") router.push("/dashboard");
                    else if (item.name === "Status") router.push(`/status?category=${category}`);
                    else if (item.name === "Records") router.push("/records");
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ease-in-out cursor-pointer ${
                    isActive
                      ? "bg-[#046241] dark:bg-[#1c2419] text-white dark:text-[#ffb347] font-bold shadow-md shadow-[#046241]/20 dark:shadow-none"
                      : "text-gray-300 dark:text-white/80 hover:text-white hover:bg-white/10 dark:hover:bg-white/5 font-semibold"
                  }`}
                  title={!isExpanded ? item.label : undefined}
                >
                  <div className="flex items-center gap-4">
                    {item.icon}
                    {isExpanded && (
                      <span className="animate-in fade-in duration-300 whitespace-nowrap overflow-hidden text-sm">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {/* Gold Circle for active item */}
                  {isActive && isExpanded ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffb347] inline-block flex-shrink-0 animate-pulse" />
                  ) : null}
                </button>

                {/* Subcategories */}
                {isActive && isExpanded && hasSubcategories && (
                  <div className="flex flex-col ml-[26px] pl-3 border-l border-white/20 mt-1 mb-2 gap-1 relative">
                    <button
                      onClick={() => router.push(`/${item.name.toLowerCase()}?category=Companies`)}
                      className={`flex items-center gap-3 w-full text-left text-[13px] font-bold py-2.5 px-3 rounded-xl transition-all duration-300 ease-in-out ${
                        category === "Companies"
                          ? "bg-white text-[#133020] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                          : "text-gray-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0A2.25 2.25 0 001.5 12v4.5c0 1.242.946 2.228 2.155 2.247h16.69c1.21-.019 2.155-1.005 2.155-2.247V12a2.25 2.25 0 00-2.25-2.224m-16.5 0V7.5a2.25 2.25 0 012.25-2.25h4.018c.228 0 .446.102.588.277l1.414 1.768a1.5 1.5 0 001.176.556h5.304A2.25 2.25 0 0121 9.776" />
                      </svg>
                      Companies
                    </button>
                    <button
                      onClick={() => router.push(`/${item.name.toLowerCase()}?category=Filipino Community Organizations`)}
                      className={`flex items-center gap-3 w-full text-left text-[13px] font-bold py-2.5 px-3 rounded-xl transition-all duration-300 ease-in-out ${
                        category === "Filipino Community Organizations"
                          ? "bg-white text-[#133020] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                          : "text-gray-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      Filipino Community Orgs
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Lifewood Branding Section */}
      <div className="flex flex-col gap-3 mb-3 px-3">
        {/* Lifewood Logo right above the user name */}
        <div className="flex items-center justify-center px-2 py-2 bg-black/20 dark:bg-white/5 rounded-xl border border-white/5 h-12 overflow-hidden relative w-full">
          {isExpanded ? (
            <div className="relative h-full flex items-center justify-center">
              {/* Text part (Green neon) */}
              <img 
                src="/lifewood-logo.png" 
                alt="Lifewood Logo Text" 
                className={`h-full w-auto object-contain transition-all duration-300 pointer-events-none`}
                style={{ 
                  filter: isDarkMode ? 'brightness(0) invert(1) drop-shadow(0 0 2px rgba(255,255,255,0.5))' : 'none',
                  clipPath: 'inset(0 0 0 12.5%)'
                }}
                suppressHydrationWarning
              />
              {/* Diamond part (Saffron neon) */}
              <img 
                src="/lifewood-logo.png" 
                alt="Lifewood Logo Diamond" 
                className={`absolute top-0 left-0 h-full w-auto object-contain transition-all duration-300 pointer-events-none`}
                style={{ 
                  filter: isDarkMode ? 'brightness(0) saturate(100%) invert(78%) sepia(35%) saturate(1478%) hue-rotate(331deg) brightness(102%) contrast(101%) drop-shadow(0 0 6px rgba(255, 179, 71, 0.8))' : 'none',
                  clipPath: 'inset(0 87.5% 0 0)'
                }}
                suppressHydrationWarning
              />
            </div>
          ) : (
            <img 
              src="/lifewood-logo.png" 
              alt="LW" 
              className={`h-full w-[16px] object-cover object-left scale-[1.35] origin-left transition-all duration-300`}
              style={{ filter: isDarkMode ? 'brightness(0) saturate(100%) invert(78%) sepia(35%) saturate(1478%) hue-rotate(331deg) brightness(102%) contrast(101%) drop-shadow(0 0 6px rgba(255, 179, 71, 0.8))' : 'none' }}
              suppressHydrationWarning
            />
          )}
        </div>

        {/* Profile card area */}
        <div className={`py-2.5 flex items-center overflow-hidden bg-white/5 dark:bg-white/5 rounded-2xl border border-white/10 dark:border-white/5 transition-all duration-300 ${isExpanded ? 'px-3 justify-between gap-2' : 'px-0 justify-center'}`}>
          <div className={`flex items-center min-w-0 ${isExpanded ? 'gap-3' : 'gap-0'}`}>
            {/* Initials badge */}
            <div className="w-9 h-9 rounded-full bg-[#046241] dark:bg-[#ffb347] flex items-center justify-center font-bold text-white dark:text-[#133020] text-xs flex-shrink-0 shadow-inner">
              {mounted && user ? getInitials(user.name) : "U"}
            </div>
            {isExpanded && (
              <div className="flex flex-col min-w-0 animate-in fade-in duration-300">
                <span className="text-xs font-bold truncate text-white">
                  {mounted && user ? user.name : "Loading..."}
                </span>
                <span className="text-[10px] text-gray-300 dark:text-white/60 leading-none mt-0.5 capitalize">
                  {user?.role === 'admin' ? 'Administrator' : 'Standard User'}
                </span>
              </div>
            )}
          </div>

          {/* Theme Toggle & Sign out */}
          {isExpanded && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsDarkMode((currentMode) => !currentMode)}
                className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
                aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
              >
                {isDarkMode ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="4" />
                    <path strokeLinecap="round" d="M12 2.25v1.5M12 20.25v1.5M4.93 4.93l1.06 1.06M18.01 18.01l1.06 1.06M2.25 12h1.5M20.25 12h1.5M4.93 19.07l1.06-1.06M18.01 5.99l1.06-1.06" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Log out"
                aria-label="Log out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

    </nav>
  );
}

