"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CompanyData } from "../leads/CompanyCard";
import { SelectDropdown } from "../ui/SelectDropdown";
import { normalizeLocationName, getCountryForLocation } from "../../lib/normalize";

interface PipelineViewProps {
  companies: CompanyData[];
}

export function PipelineView({ companies }: PipelineViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const activeTab = (typeParam === "Hot Leads" || typeParam === "Cold Leads") ? typeParam : "Hot Leads";
  
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [selectedSource, setSelectedSource] = React.useState("All Files");

  const allSources = ["All Files", ...Array.from(new Set(companies.map(c => c.source).filter(Boolean)))].sort();

  const filteredCompanies = companies.filter(c => {
    return selectedSource === "All Files" || (c.source || "Unknown") === selectedSource;
  });

  const hotLeads = filteredCompanies.filter(c => c.status === "Hot Lead");
  const coldLeads = filteredCompanies.filter(c => c.status === "Cold Lead");
  
  const displayLeads = activeTab === "Hot Leads" ? hotLeads : coldLeads;

  const handleSyncEmails = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync-emails", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`Email sync complete! Found ${data.updatedCount} new replies.`);
        window.location.reload();
      } else {
        alert(`Error syncing emails: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to sync emails.");
    } finally {
      setIsSyncing(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Hot Lead": return "text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800 shadow-[0_0_10px_rgba(239,68,68,0.3)]";
      case "Cold Lead": return "text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800 shadow-[0_0_10px_rgba(59,130,246,0.3)]";
      default: return "text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700";
    }
  };

  const getIconColor = (status?: string) => {
    switch (status) {
      case "Hot Lead": return "bg-red-500";
      case "Cold Lead": return "bg-blue-500";
      default: return "bg-gray-400 dark:bg-gray-500";
    }
  };

  const handleRouteLead = (company: CompanyData) => {
    // Generate a placeholder email based on the service intent (e.g. aigc.services@lifewood.com)
    const serviceString = company.aiServiceIntent ? company.aiServiceIntent.toLowerCase().replace(/[^a-z0-9]/g, '') : 'general';
    const recipient = `${serviceString}.department@lifewood.com`;
    
    const subject = encodeURIComponent(`New Lead Routing: ${company.name} - ${company.aiServiceIntent || 'Uncategorized'}`);
    
    let body = `Hello ${company.aiServiceIntent || 'Team'} Department,\n\n`;
    body += `Please review the following lead routed to you by the AI Pipeline:\n\n`;
    body += `===============================\n`;
    body += `COMPANY: ${company.name}\n`;
    body += `INDUSTRY: ${company.industries.join(', ') || 'General'}\n`;
    body += `COUNTRY: ${company.country}\n`;
    body += `===============================\n\n`;
    body += `CONTACT PERSON: ${company.contactPerson || 'Not Provided'}\n`;
    body += `TITLE: ${company.designation || 'Not Provided'}\n`;
    body += `EMAIL: ${company.email || 'Not Provided'}\n`;
    body += `MOBILE: ${company.contactMobile || 'Not Provided'}\n\n`;
    body += `AI CLASSIFICATION: ${company.status || 'Not Active'}\n`;
    body += `SERVICE INTENT: ${company.aiServiceIntent || 'Not Categorized'}\n\n`;
    body += `Please reach out to this client as soon as possible.\n\n`;
    body += `Regards,\nLifewood AI Routing System`;

    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="flex flex-col h-full gap-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 mt-2">
        <div>
          <h1 className="text-[32px] md:text-4xl font-black tracking-tight mb-1 text-[#046241] dark:text-[#4ade80]">
            Response Pipeline
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Manage and route your AI-categorized client responses.</p>
        </div>
        <div className="flex items-center gap-3">
          <SelectDropdown
            value={selectedSource}
            onChange={setSelectedSource}
            options={allSources.map(s => ({ label: String(s), value: String(s) }))}
            className="flex items-center justify-between gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-[#046241]/20 dark:border-white/10 hover:border-[#046241]/50 dark:hover:border-white/30 transition-all bg-white dark:bg-[#1c1915] text-[#133020] dark:text-gray-200 min-w-[180px] shadow-xs"
            dropdownClassName="absolute top-full right-0 mt-2 w-[220px] bg-white dark:bg-[#1c1915] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden"
            optionClassName="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors truncate"
            activeOptionClassName="w-full text-left px-4 py-2.5 text-sm font-bold bg-[#046241]/5 dark:bg-[#ffb347]/10 text-[#046241] dark:text-[#ffb347] truncate"
          />
          <button 
            onClick={handleSyncEmails}
            disabled={isSyncing}
            title="Sync Emails"
            className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all text-white active:translate-y-1 active:border-b-0 ${
              isSyncing 
                ? 'bg-gray-400 border-b-4 border-gray-500 cursor-not-allowed' 
                : 'bg-[#046241] hover:bg-[#133020] border-b-4 border-[#0F2E1E] hover:border-[#0a1e14]'
            }`}
          >
            <svg className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#14120e] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col min-h-[360px]">
        {/* Table Header */}
        <div className="grid grid-cols-[40px_auto_2.5fr_1fr_1.5fr_1.5fr_80px_1.2fr_80px] gap-4 items-center px-6 py-4 bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 text-[11px] font-black text-gray-400 uppercase tracking-widest overflow-visible">
          <div>No.</div>
          <div className="w-10"></div>
          <div>Name / Organization</div>
          <div>Classification</div>
          <div>Contact Person</div>
          <div>Service Intent (AI)</div>
          <div className="justify-self-center text-center">Action</div>
          <div>Status</div>
          <div className="text-right">Updated</div>
        </div>

        {/* Table Rows */}
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {displayLeads.length > 0 ? (
            displayLeads.map((company, i) => (
              <div
                key={company.id}
                className="grid grid-cols-[40px_auto_2.5fr_1fr_1.5fr_1.5fr_80px_1.2fr_80px] gap-4 items-center px-4 py-3.5 rounded-xl hover:bg-[#046241]/5 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-[#046241]/20 dark:hover:border-white/10"
              >
                {/* Number */}
                <div className="text-sm font-bold text-gray-400 dark:text-gray-500 pl-2">
                  {i + 1}
                </div>

                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner flex-shrink-0 ${getIconColor(company.status)}`}>
                  {getInitials(company.name)}
                </div>

                {/* Name */}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-[#133020] dark:text-white whitespace-normal break-words max-w-xs group-hover:text-[#046241] dark:group-hover:text-[#ffb347] transition-colors">
                    {company.name}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 whitespace-normal break-words max-w-xs mt-1">
                    {company.country} · {company.source || "Manual Entry"}
                  </span>
                </div>
                
                {/* Classification */}
                <div className="text-[11px] font-bold text-gray-600 dark:text-gray-300 whitespace-normal break-words max-w-[120px]">
                  {company.category || "Companies"}
                </div>

                {/* Contact Person & Designation */}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-normal break-words max-w-[150px]">
                    {company.contactPerson || "Not Provided"}
                  </span>
                  <span className="text-[11px] font-medium text-[#046241] dark:text-[#ffb347] whitespace-normal break-words max-w-[150px] mt-1">
                    {company.designation || "Representative"}
                  </span>
                </div>

                {/* Service Intent (AI) */}
                <div className="flex flex-wrap gap-1 items-center">
                  {company.aiServiceIntent ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 shadow-[0_0_8px_rgba(168,85,247,0.2)] truncate max-w-[180px]">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      {company.aiServiceIntent}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-gray-400 italic">Uncategorized</span>
                  )}
                </div>

                {/* Action */}
                <div className="justify-self-center">
                  <button
                    onClick={() => handleRouteLead(company)}
                    title="Route to Department"
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-[#ffb347] text-gray-400 hover:text-[#133020] dark:bg-white/5 dark:hover:bg-[#ffb347] transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                  </button>
                </div>

                {/* Status */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusColor(company.status || "Not Active")}`}>
                    <span className={`w-2 h-2 rounded-full ${company.status === 'Hot Lead' ? 'bg-red-500' : company.status === 'Cold Lead' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                    {company.status || "Not Active"}
                  </span>
                </div>

                {/* Date */}
                <div className="text-right text-xs font-bold text-gray-400 whitespace-nowrap">
                  {company.updatedAt || "Today"}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-3">
              <svg className="w-16 h-16 text-gray-300 dark:text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.84 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
              <span className="text-lg font-black text-gray-900 dark:text-white">No {activeTab} yet</span>
              <p className="text-sm font-medium">Click "Sync Emails" to check Outlook for new client responses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
