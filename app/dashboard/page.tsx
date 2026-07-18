"use client";

import React from "react";
import { useDashboardData } from "../../lib/hooks/useDashboardData";
import { Sidebar } from "../../components/dashboard/Sidebar";
import { SummaryCards } from "../../components/dashboard/SummaryCards";
import { PortfolioStatus } from "../../components/dashboard/PortfolioStatus";
import { CountryChart } from "../../components/dashboard/CountryChart";

import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { MonthlyOffersChart } from "../../components/dashboard/MonthlyOffersChart";

export default function DashboardPage() {
  const {
    user,
    stats,
    countriesData,
    industriesData,
    isDarkMode,
    setIsDarkMode,
    activeTab,
    setActiveTab,
    handleLogout,
    availableFiles,
    allCompanyNames
  } = useDashboardData();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState("All Files");

  const formattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <main className="h-screen w-full flex overflow-hidden bg-[#f5eedb] dark:bg-[#0d0b09] transition-colors duration-300 font-sans">

      {/* Left Navigation Bar */}
      <Sidebar
        user={user}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />

      {/* Right Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 transition-all duration-300 bg-[#f5eedb] dark:bg-[#0d0b09]">

        {/* Top Bar Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-2">
          <div>
            {/* Live Badge */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#046241]/10 dark:bg-[#ffb347]/10 text-[10px] font-bold uppercase tracking-widest text-[#046241] dark:text-[#ffb347] mb-2.5 border border-[#046241]/20 dark:border-[#ffb347]/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#046241] dark:bg-[#ffb347] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#046241] dark:bg-[#ffb347]"></span>
              </span>
              Live • Real-Time
            </div>

            {/* Main Title */}
            <h1 className="text-[32px] md:text-4xl font-black tracking-tight mb-1">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#133020] via-[#046241] to-[#b45309] dark:from-[#4ade80] dark:via-[#2dd4bf] dark:to-[#ffb347]">
                Dashboard Overview
              </span>
            </h1>

            {/* Subtitle / Date */}
            <p className="text-xs md:text-sm font-medium text-[#046241]/70 dark:text-gray-400 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#046241]/50 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formattedDate()}
            </p>
          </div>
        </div>

        {/* Dashboard Header: Search and Filter */}
        <DashboardHeader 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          availableFiles={availableFiles}
          allCompanyNames={allCompanyNames}
        />

        {/* Layout Grid */}
        <div className="flex flex-col gap-6">

          {/* Middle Section */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Monthly Offers Chart */}
            <div className="flex-[2]">
              <MonthlyOffersChart 
                selectedFile={selectedFile} 
                hasData={stats.acceptedOfferCount > 0} 
                monthlyData={stats.monthlyAccepted}
              />
            </div>

            {/* Right side: Summary Cards and Portfolio Status */}
            <div className="w-full lg:w-[40%] xl:w-[35%] flex flex-col gap-6">
              <SummaryCards stats={stats} />
              <PortfolioStatus stats={stats} />
            </div>

          </div>

          {/* Chart: Companies per Country */}
          <CountryChart countriesData={countriesData} />

        </div>

        {/* Float Help Button */}
        <div className="fixed bottom-6 right-6 z-20">
          <button className="w-10 h-10 rounded-full bg-[#133020] dark:bg-white text-white dark:text-[#133020] flex items-center justify-center font-extrabold shadow-lg hover:scale-105 transition-transform cursor-pointer text-sm">
            ?
          </button>
        </div>

      </div>

    </main>
  );
}
