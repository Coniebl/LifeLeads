"use client";

import React from "react";
import { useDashboardContext } from "../../lib/contexts/DashboardContext";
import { SummaryCards } from "../../components/dashboard/SummaryCards";
import { PortfolioStatus } from "../../components/dashboard/PortfolioStatus";
import { CountryChart } from "../../components/dashboard/CountryChart";

import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { MonthlyOffersChart } from "../../components/dashboard/MonthlyOffersChart";
import { DashboardGreetingCard } from "../../components/dashboard/DashboardGreetingCard";

export default function DashboardPage() {
  const {
    stats,
    countriesData,
    industriesData,
    availableFiles,
    allCompanyNames,
    leadsType,
    setLeadsType,
  } = useDashboardContext();

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
    <>

        {/* Top Bar Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-2">
          <div>
            {/* Main Title */}
            <h1 className="text-[32px] md:text-4xl font-black tracking-tight mb-1">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#133020] via-[#046241] to-[#b45309] dark:from-[#4ade80] dark:via-[#2dd4bf] dark:to-[#ffb347]">
                Dashboard Overview
              </span>
            </h1>
          </div>
        </div>

        {/* Dashboard Greeting Card */}
        <DashboardGreetingCard />

        {/* Dashboard Header: Search and Filter */}
        <DashboardHeader 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          availableFiles={availableFiles}
          allCompanyNames={allCompanyNames}
          leadsType={leadsType}
          setLeadsType={setLeadsType}
        />

        {/* Layout Grid */}
        <div className="flex flex-col gap-6">

          {/* Middle Section */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Monthly Offers Chart */}
            <div className="flex-[2]">
              <MonthlyOffersChart 
                selectedFile={selectedFile} 
                hasData={stats.acceptedOfferCount > 0 || stats.rejectedCount > 0} 
                monthlyAccepted={stats.monthlyAccepted}
                monthlyRejected={stats.monthlyRejected}
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


    </>
  );
}
