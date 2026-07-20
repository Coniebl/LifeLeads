"use client";

import React, { useState, Suspense, useEffect } from "react";
import { CompaniesView } from "../../components/leads/CompaniesView";
import { type CompanyData } from "../../components/leads/CompanyCard";

export default function CompaniesPage() {

  const [companies, setCompanies] = useState<CompanyData[]>([]);

  React.useEffect(() => {
    const fetchCompanies = async () => {
      const { fetchAllCompanyContacts } = await import("../../lib/supabase/client");
      const { data: contactsData, error: contactsErr } = await fetchAllCompanyContacts();

      if (contactsData && !contactsErr) {


        const mappedCompanies: CompanyData[] = contactsData.map((r: any) => {
          let inds: string[] = [];
          if (r.industries) {
             inds = r.industries.split(',').map((s: string) => s.replace(/[\[\]'"]/g, '').trim()).filter(Boolean);
          }
          if (inds.length === 0) inds = ["Business Services"];

          const inferredCat = r.category || "Companies";

          return {
            id: r.id.toString(),
            name: r.company_name || "Unknown Company",
            country: r.country || "Unknown",
            industries: inds,
            leads: 1,
            contactPerson: r.contact_person,
            designation: r.designation || r.position || r.role || "Executive Representative",
            contactNumber: r.contact_mobile || r.contact_telephone || r.contact_direct_line || "Not Provided",
            email: r.contact_email || "",
            linkedin: r.company_linkedin,
            website: r.company_website,
            source: r.source_file,
            category: inferredCat,
            status: r.status || "Not Active",
            updatedAt: new Date(r.status_updated_at || r.created_at || Date.now()).toLocaleDateString('en-GB')
          };
        });
        setCompanies(mappedCompanies);
      }
    };
    fetchCompanies();

    const handleUpdate = () => fetchCompanies();
    window.addEventListener('companyStatusUpdated', handleUpdate);
    return () => window.removeEventListener('companyStatusUpdated', handleUpdate);
  }, []);

  return (
    <>
      <Suspense fallback={<div className="p-8 text-center text-gray-500 font-bold">Loading leads data...</div>}>
          <CompaniesView companies={companies} setCompanies={setCompanies} />
      </Suspense>
    </>
  );
}
