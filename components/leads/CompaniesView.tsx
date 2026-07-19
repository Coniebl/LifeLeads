"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CompanyCard, type CompanyData } from "./CompanyCard";
import { SelectDropdown } from "../ui/SelectDropdown";
import { supabase } from "../../lib/supabase/client";

export function CompaniesView({ companies, setCompanies }: { companies: CompanyData[], setCompanies: React.Dispatch<React.SetStateAction<CompanyData[]>> }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedIndustry, setSelectedIndustry] = useState("All Industries");
  const [selectedCountry, setSelectedCountry] = useState("All Countries");
  const [selectedSource, setSelectedSource] = useState("All Records");
  
  // Subcategories: Companies vs Filipino Community Organizations
  const activeSubcategory = searchParams.get("category") || "Companies";
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [isComposingEmail, setIsComposingEmail] = useState(false);
  const [hasSentEmail, setHasSentEmail] = useState(false);
  const [emailBody, setEmailBody] = useState("");
  const [showEmailProviders, setShowEmailProviders] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Reset modal states when selectedCompany changes
  useEffect(() => {
    if (selectedCompany) {
      setIsComposingEmail(false);
      setHasSentEmail(false);
      setEmailBody("");
      setShowEmailProviders(false);
      setSelectedTemplate(null);
    }
  }, [selectedCompany?.name]);

  const allIndustries = ["All Industries", ...Array.from(new Set(companies.flatMap(c => c.industries)))];
  const allCountries = ["All Countries", ...Array.from(new Set(companies.map(c => c.country)))];
  const allSources = ["All Records", ...Array.from(new Set(companies.map(c => c.source).filter(Boolean)))] as string[];

  // Filter companies that belong to Leads (`!status || status === "Not Active"`) and match the active subcategory
  const filteredCompanies = companies.filter(c => {
    // Check if item has already been processed out of Leads
    if (c.status === "Pending" || c.status === "Accepted" || c.status === "Rejected") {
      return false;
    }

    // Classify category: use explicit category or infer from name
    const itemCategory = c.category || "Companies";

    if (itemCategory !== activeSubcategory) return false;

    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.contactPerson && c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesIndustry = selectedIndustry === "All Industries" || c.industries.includes(selectedIndustry);
    const matchesCountry = selectedCountry === "All Countries" || c.country === selectedCountry;
    const matchesSource = selectedSource === "All Records" || (c.source || "Unknown") === selectedSource;
    return matchesSearch && matchesIndustry && matchesCountry && matchesSource;
  });

  // 20 cards per page (5 columns x 4 rows)
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage) || 1;
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubcategory, searchTerm, selectedIndustry, selectedCountry, selectedSource]);

  // Handle generating email templates
  const handleTemplateClick = (templateType: "Introduction" | "Partnerships" | "Follow Ups") => {
    if (!selectedCompany) return;
    setSelectedTemplate(templateType);
    const name = selectedCompany.name;
    const contact = selectedCompany.contactPerson ? `Dear ${selectedCompany.contactPerson},\n\n` : `Dear ${name} Team,\n\n`;

    if (templateType === "Introduction") {
      setEmailBody(`${contact}I hope this message finds you well.\n\nI am reaching out to formally introduce you to our company, Lifewood Data Technology, and the services that we offer to other companies and organizations globally. We offer global data engineering, processing, and AI training services that helps our clients.\n\n We have been following ${name}'s impactful work across ${selectedCompany.country} and believe our collaborative services could provide significant value to your upcoming initiatives.\n\nWe would welcome the opportunity for a brief introductory call to share how we can support your goals.\n\nBest regards,\nLifewood PH Team`);
    } else if (templateType === "Partnerships") {
      setEmailBody(`${contact}We have been closely admiring ${name}'s leadership in the ${selectedCompany.industries[0] || "business"} sector. At Lifewood Data Technology, we actively partner with premier organizations to streamline regional expansion and strategic outreach.\n\nWe would love to explore potential partnership opportunities between our teams that align with your long-term vision.\n\nBest regards,\nLifewood PH Team`);
    } else if (templateType === "Follow Ups") {
      setEmailBody(`${contact}I am following up on our previous communication regarding potential collaboration with LifeLeads. We remain very eager to connect with ${name} and explore tailored solutions for your organization.\n\nPlease let us know when you might have 15 minutes available for a brief discussion.\n\nSincerely,\nLifewood PH Team`);
    }
  };

  const handleCopyExtract = () => {
    if (!emailBody.trim()) {
      showToast("Email body is empty!");
      return;
    }
    navigator.clipboard.writeText(emailBody);
    showToast("Extracted & copied email text to clipboard!");
  };

  const handleProviderSend = (provider: "gmail" | "outlook" | "yahoo" | "default") => {
    setHasSentEmail(true);

    const recipient = selectedCompany?.email || "";
    const subject = encodeURIComponent(`Connection Request - ${selectedCompany?.name}`);
    const body = encodeURIComponent(emailBody);

    let url = "";

    switch (provider) {
      case "gmail":
        url = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`;
        break;
      case "outlook":
        url = `https://outlook.live.com/mail/0/deeplink/compose?to=${recipient}&subject=${subject}&body=${body}`;
        break;
      case "yahoo":
        url = `https://compose.mail.yahoo.com/?to=${recipient}&subject=${subject}&body=${body}`;
        break;
      case "default":
      default:
        url = `mailto:${recipient}?subject=${subject}&body=${body}`;
        break;
    }

    if (provider === "default") {
      window.location.href = url;
    } else {
      window.open(url, "_blank");
    }

    setIsComposingEmail(false);
    setShowEmailProviders(false);
  };

  const handleManualContact = () => {
    setHasSentEmail(true);
    showToast(`Marked as contacted manually! Process button is now unlocked.`);
  };

  const handleProcessLead = async () => {
    if (!selectedCompany) return;
    if (!hasSentEmail) {
      showToast("Please send an email or mark as contacted first to unlock processing.");
      return;
    }

    // Update status to Pending so it moves to Status tab
    await supabase.from('company_contacts').update({ 
      status: 'Pending',
      status_updated_at: new Date().toISOString()
    }).eq('company_name', selectedCompany.name);
    
    // Update local state
    setCompanies(prev => prev.map(c => c.name === selectedCompany.name ? { ...c, status: "Pending" } : c));
    showToast(`${selectedCompany.name} processed and moved to Status tab!`);

    // Find next company in current list to auto-open
    const currentIdx = filteredCompanies.findIndex(c => c.name === selectedCompany.name);
    if (currentIdx !== -1 && currentIdx + 1 < filteredCompanies.length) {
      const nextCompany = filteredCompanies[currentIdx + 1];
      setSelectedCompany(nextCompany);
    } else if (currentIdx !== -1 && currentIdx - 1 >= 0) {
      const prevCompany = filteredCompanies[currentIdx - 1];
      setSelectedCompany(prevCompany);
    } else {
      setSelectedCompany(null);
    }

    window.dispatchEvent(new Event('companyStatusUpdated'));
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full animate-in fade-in duration-500 relative pb-10">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[1000] px-5 py-3.5 bg-[#133020] text-[#ffb347] font-black text-sm rounded-2xl shadow-2xl border border-[#ffb347]/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Top Header & Page Title with Subcategory Display */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-1">
        <div>
          {/* Main Title showing Tab + active subcategory */}
          <h1 className="text-[32px] md:text-4xl font-black tracking-tight mb-1">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#133020] via-[#046241] to-[#b45309] dark:from-[#4ade80] dark:via-[#2dd4bf] dark:to-[#ffb347]">
              Leads - {activeSubcategory}
            </span>
          </h1>
          <p className="text-sm font-medium text-[#046241]/70 dark:text-gray-400">
            Showing {filteredCompanies.length} not active leads · {activeSubcategory}
          </p>
        </div>

      </div>

      {/* Unified Search and Filters Bar */}
      <div className="flex flex-col xl:flex-row items-center gap-4 bg-white dark:bg-[#1a1714] rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_4px_20px_-10px_rgba(4,98,65,0.1)] p-2 w-full">
        
        {/* Search Bar */}
        <div className="relative flex-1 w-full min-w-[200px]">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search leads by company, country, contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-full pl-12 pr-4 py-3 bg-transparent text-sm font-semibold text-[#133020] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#046241] dark:focus:ring-[#ffb347] rounded-xl transition-all"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center justify-end gap-3 xl:pl-4 xl:border-l border-gray-100 dark:border-white/10 pb-1 xl:pb-0">
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hidden xl:block flex-shrink-0">Filters</span>
          
          <SelectDropdown
            value={selectedSource}
            onChange={setSelectedSource}
            options={allSources.map(s => ({ label: s, value: s }))}
            icon={
              <svg className="w-4 h-4 text-[#046241] dark:text-[#ffb347] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
            className="flex items-center justify-between gap-2 px-4 py-3 bg-[#046241]/5 dark:bg-white/5 hover:bg-[#046241]/10 dark:hover:bg-white/10 focus:ring-2 focus:ring-[#046241] dark:focus:ring-[#ffb347] focus:outline-none rounded-xl transition-all text-sm font-bold text-[#046241] dark:text-[#ffb347]"
            dropdownClassName="absolute top-full mt-2 left-0 w-full min-w-[200px] bg-white dark:bg-[#1a1714] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            optionClassName="w-full text-left px-4 py-2.5 text-sm font-medium text-[#133020] dark:text-gray-300 hover:bg-[#f5eedb] dark:hover:bg-[#133020] transition-colors"
            activeOptionClassName="w-full text-left px-4 py-2.5 text-sm font-bold bg-[#046241]/10 dark:bg-[#046241]/30 text-[#046241] dark:text-[#ffb347] transition-colors"
          />

          <SelectDropdown
            value={selectedIndustry}
            onChange={setSelectedIndustry}
            options={allIndustries.map(i => ({ label: i, value: i }))}
            icon={
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
              </svg>
            }
            className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 focus:ring-2 focus:ring-[#046241] dark:focus:ring-[#ffb347] focus:outline-none rounded-xl transition-all text-sm font-semibold text-gray-700 dark:text-gray-200"
            dropdownClassName="absolute top-full mt-2 left-0 w-full min-w-[200px] bg-white dark:bg-[#1a1714] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            optionClassName="w-full text-left px-4 py-2.5 text-sm font-medium text-[#133020] dark:text-gray-300 hover:bg-[#f5eedb] dark:hover:bg-[#133020] transition-colors"
            activeOptionClassName="w-full text-left px-4 py-2.5 text-sm font-bold bg-[#046241]/10 dark:bg-[#046241]/30 text-[#046241] dark:text-[#ffb347] transition-colors"
          />
          
          <SelectDropdown
            value={selectedCountry}
            onChange={setSelectedCountry}
            options={allCountries.map(c => ({ label: c, value: c }))}
            icon={
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            }
            className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 focus:ring-2 focus:ring-[#046241] dark:focus:ring-[#ffb347] focus:outline-none rounded-xl transition-all text-sm font-semibold text-gray-700 dark:text-gray-200"
            dropdownClassName="absolute top-full right-0 mt-2 w-full min-w-[200px] bg-white dark:bg-[#1a1714] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            optionClassName="w-full text-left px-4 py-2.5 text-sm font-medium text-[#133020] dark:text-gray-300 hover:bg-[#f5eedb] dark:hover:bg-[#133020] transition-colors"
            activeOptionClassName="w-full text-left px-4 py-2.5 text-sm font-bold bg-[#046241]/10 dark:bg-[#046241]/30 text-[#046241] dark:text-[#ffb347] transition-colors"
          />
        </div>
      </div>

      {/* Grid Content: 5 Columns x 4 Rows = 20 cards per page */}
      {paginatedCompanies.length > 0 ? (
        <div className="flex flex-col w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-1">
            {paginatedCompanies.map((company, idx) => (
              <CompanyCard key={idx} company={company} onClick={() => setSelectedCompany(company)} />
            ))}
          </div>

          {/* Pagination Navigation (20 cards per page) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-2 mt-6 mb-4">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCompanies.length)} of {filteredCompanies.length} cards
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-[#133020] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 rounded-lg bg-[#046241]/10 dark:bg-white/10 text-xs font-black text-[#046241] dark:text-[#ffb347]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-[#133020] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 mt-4 bg-white/50 dark:bg-[#1a1714]/50 border border-dashed border-[#046241]/20 dark:border-white/10 rounded-3xl">
          <div className="w-16 h-16 bg-[#f5eedb] dark:bg-[#133020] rounded-full flex items-center justify-center mb-4 shadow-sm border border-[#046241]/20 dark:border-[#ffb347]/20">
            <svg className="w-8 h-8 text-[#046241] dark:text-[#ffb347]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#133020] dark:text-white mb-2">No {activeSubcategory} Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
            {companies.length === 0 
              ? "Your database is currently empty. Import Excel data in the Records tab to populate leads." 
              : `No leads in ${activeSubcategory} match your active search or filters.`}
          </p>
        </div>
      )}
      
      {/* Centered Modal Backdrop and Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
            onClick={() => setSelectedCompany(null)} 
          />
          <div 
            className="bg-white/95 dark:bg-[#14120e]/95 backdrop-blur-xl shadow-2xl rounded-3xl w-full max-w-2xl border border-gray-100 dark:border-white/10 flex flex-col relative max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 z-10"
          >
            <div className="flex flex-col h-full relative overflow-hidden">
            
            {/* Top Control Bar inside Drawer */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
              {isComposingEmail ? (
                <button
                  onClick={() => setIsComposingEmail(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-xs font-bold text-[#133020] dark:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Back to Details
                </button>
              ) : (
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Lead Profile
                </span>
              )}

              <div className="flex items-center gap-2">
                {/* Upper Right Corner Mail Icon */}
                {!isComposingEmail && (
                  <button
                    onClick={() => {
                      setIsComposingEmail(true);
                      handleTemplateClick("Introduction");
                    }}
                    className="p-2.5 rounded-xl bg-[#046241]/10 dark:bg-[#ffb347]/15 text-[#046241] dark:text-[#ffb347] hover:scale-105 transition-all shadow-sm"
                    title="Compose Email to Contact"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </button>
                )}

                {/* Close Button */}
                <button 
                  onClick={() => setSelectedCompany(null)} 
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Email Composing Form View vs Lead Details View */}
            {isComposingEmail ? (
              <div className="p-6 flex flex-col flex-1 gap-5">
                {/* Contact Banner */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-[#046241] flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md">
                    {selectedCompany.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-extrabold text-[#133020] dark:text-white truncate">
                      {selectedCompany.name}
                    </span>
                    <span className="text-xs font-semibold text-[#046241] dark:text-[#ffb347] truncate">
                      {selectedCompany.email || "client.contact@company.org"}
                    </span>
                  </div>
                </div>

                {/* 3 Template Buttons */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Quick Email Templates
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Introduction", "Partnerships", "Follow Ups"] as const).map(tmpl => (
                      <button
                        key={tmpl}
                        onClick={() => handleTemplateClick(tmpl)}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all text-center shadow-xs ${
                          selectedTemplate === tmpl
                            ? "bg-[#046241] text-white"
                            : "bg-[#046241]/10 dark:bg-white/10 hover:bg-[#046241]/20 text-[#046241] dark:text-gray-200"
                        }`}
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Body Field */}
                <div className="flex flex-col flex-1 gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Message Content
                  </label>
                  <textarea
                    rows={10}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Select a template above or type your message here..."
                    className="w-full flex-1 p-4 bg-white dark:bg-[#1a1714] border border-gray-200 dark:border-white/10 rounded-2xl text-xs font-medium text-[#133020] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#046241] dark:focus:ring-[#ffb347] transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Bottom Actions: Extract Text on Left, Send on Right */}
                <div className="flex flex-col gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
                  {showEmailProviders ? (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                        Select Email Platform
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          onClick={() => handleProviderSend("gmail")}
                          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 text-xs font-bold transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 8.414l8.073-4.921c1.618-1.214 3.927-.059 3.927 1.964Z"/></svg>
                          Gmail
                        </button>
                        <button
                          onClick={() => handleProviderSend("outlook")}
                          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 text-xs font-bold transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M1.38 6.55L14 2.76v18.42L1.38 17.45V6.55zM15 4.3v15.4h7.62V4.3H15zm2.86 10.93c-1.16 0-2.04-.9-2.04-2.12 0-1.23.88-2.13 2.04-2.13 1.15 0 2.03.9 2.03 2.13 0 1.22-.88 2.12-2.03 2.12zm0-1c.54 0 .9-.45.9-1.12 0-.66-.36-1.12-.9-1.12-.53 0-.9.46-.9 1.12 0 .67.37 1.12.9 1.12z" /></svg>
                          Outlook
                        </button>
                        <button
                          onClick={() => handleProviderSend("yahoo")}
                          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20 text-xs font-bold transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 5.56L13.88 18.2v5.8h-3.76v-5.8L1.54 5.56h4.15l6.32 10.3 6.32-10.3h4.13z"/></svg>
                          Yahoo
                        </button>
                        <button
                          onClick={() => handleProviderSend("default")}
                          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20 text-xs font-bold transition-colors"
                          title="Apple Mail, Teams, or System Default"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                          Default App
                        </button>
                      </div>
                      <button
                        onClick={() => setShowEmailProviders(false)}
                        className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-center mt-1 transition-colors uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={handleCopyExtract}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-bold text-gray-700 dark:text-gray-200 transition-all"
                        title="Extract and copy text to clipboard"
                      >
                        <svg className="w-4 h-4 text-[#046241] dark:text-[#ffb347]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                        Extract Text
                      </button>
  
                      <button
                        onClick={() => {
                          if (!emailBody.trim()) {
                            showToast("Please select a template or write an email first.");
                            return;
                          }
                          setShowEmailProviders(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#046241] to-[#ffb347] text-white font-black text-xs shadow-lg shadow-[#046241]/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Send Mail
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Lead Details View */
              <div className="p-4 flex flex-col items-center mt-1">
                {/* Company Icon (Top Center) */}
                <div className="w-16 h-16 rounded-3xl bg-[#046241] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-[#046241]/20 mb-3 border-4 border-[#f5eedb] dark:border-white/5">
                  {selectedCompany.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                </div>

                {/* Company Name */}
                <h2 className="text-xl font-black text-[#133020] dark:text-white mb-1 text-center">
                  {selectedCompany.name}
                </h2>

                {/* Country */}
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-3 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5 text-[#ffb347]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {selectedCompany.country}
                </div>

                {/* Industry Type */}
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {selectedCompany.industries.map(ind => (
                    <span key={ind} className="px-3.5 py-1 rounded-full bg-[#046241]/10 dark:bg-[#046241]/30 text-[11px] font-black text-[#046241] dark:text-[#4ade80] uppercase tracking-wider">
                      {ind}
                    </span>
                  ))}
                </div>

                {/* Details List */}
                <div className="w-full space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                  {/* Contact Person with Designation below name */}
                  <div className="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Person</label>
                    <div className="flex items-center gap-3 text-[#133020] dark:text-white font-extrabold text-base mt-0.5">
                      <svg className="w-5 h-5 text-[#046241]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      {selectedCompany.contactPerson || "Not Provided"}
                    </div>
                    <div className="text-xs font-semibold text-[#046241] dark:text-[#ffb347] pl-8">
                      {selectedCompany.designation || "Executive Representative / Lead"}
                    </div>
                  </div>

                  {/* Contact Number below contact person */}
                  <div className="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Number</label>
                    <div className="flex items-center justify-between w-full mt-0.5">
                      <div className="flex items-center gap-3 text-[#133020] dark:text-white font-bold text-sm">
                        <svg className="w-5 h-5 text-[#046241]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.25-3.95-6.847-6.847l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                        {selectedCompany.contactNumber || "Not Provided"}
                      </div>
                      <button 
                        onClick={handleManualContact} 
                        className="px-4 py-1.5 bg-[#046241]/10 text-[#046241] dark:bg-[#ffb347]/10 dark:text-[#ffb347] hover:bg-[#046241]/20 dark:hover:bg-[#ffb347]/20 text-xs font-bold rounded-lg shadow-sm hover:scale-105 transition-all"
                      >
                        Contacted
                      </button>
                    </div>
                  </div>

                  {/* Social / Web Links */}
                  <div className="flex items-center gap-3 pt-2">
                    {selectedCompany.linkedin ? (
                      <a href={selectedCompany.linkedin.startsWith("http") ? selectedCompany.linkedin : `https://${selectedCompany.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#0a66c2]/10 hover:bg-[#0a66c2]/20 text-[#0a66c2] dark:text-[#60a5fa] py-3 rounded-xl font-bold text-xs transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn
                      </a>
                    ) : (
                      <div className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 text-xs font-semibold text-center select-none">
                        No LinkedIn
                      </div>
                    )}
                    {selectedCompany.website ? (
                      <a href={selectedCompany.website.startsWith("http") ? selectedCompany.website : `https://${selectedCompany.website}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold text-xs transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                        Website
                      </a>
                    ) : (
                      <div className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 text-xs font-semibold text-center select-none">
                        No Website
                      </div>
                    )}
                  </div>

                  {/* Process Button (Locked until Email Sent) */}
                  <div className="pt-6">
                    <button
                      onClick={handleProcessLead}
                      disabled={!hasSentEmail}
                      className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition-all flex items-center justify-center gap-3 ${
                        hasSentEmail
                          ? "bg-gradient-to-r from-[#046241] to-[#ffb347] text-white shadow-xl shadow-[#046241]/25 hover:scale-102 cursor-pointer animate-pulse"
                          : "bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-gray-600 border border-gray-300 dark:border-white/5 cursor-not-allowed"
                      }`}
                    >
                      {!hasSentEmail ? (
                        <>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                          Send Mail First or Contact Client
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Process Lead & Auto-Next
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
