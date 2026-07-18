"use client";

import React, { useState, Suspense, useEffect } from "react";
import { CompaniesView } from "../../components/leads/CompaniesView";
import { type CompanyData } from "../../components/leads/CompanyCard";

export default function CompaniesPage() {

  const [companies, setCompanies] = useState<CompanyData[]>([]);

  React.useEffect(() => {
    const fetchCompanies = async () => {
      const { supabase } = await import("../../lib/supabase/client");
      const [{ data: contactsData, error: contactsErr }, { data: indData }] = await Promise.all([
        supabase.from('company_contacts').select('*'),
        supabase.from('company_industries').select('*')
      ]);

      if (contactsData && !contactsErr) {
        // Build subcategory map from company_industries & localStorage
        const subcatMap = new Map<string, "Companies" | "Filipino Community Organizations">();
        if (indData) {
          indData.forEach((row: any) => {
            if (row.company_name && row.subcategory) {
              subcatMap.set(row.company_name, row.subcategory as "Companies" | "Filipino Community Organizations");
            }
          });
        }
        try {
          const storedMap = JSON.parse(localStorage.getItem("lifelead-company-subcategories") || "{}");
          Object.entries(storedMap).forEach(([k, v]) => {
            if (v === "Companies" || v === "Filipino Community Organizations") {
              subcatMap.set(k, v);
            }
          });
        } catch (e) {}

        const companyMap = new Map<string, CompanyData>();
        contactsData.forEach((r: any) => {
          const name = r.company_name;
          if (!name) return;
          
          if (!companyMap.has(name)) {
            let inds: string[] = [];
            if (r.industries) {
               inds = r.industries.split(',').map((s: string) => s.replace(/[\[\]'"]/g, '').trim()).filter(Boolean);
            }
            if (inds.length === 0 && indData) {
               const indRows = indData.filter((i: any) => i.company_name === name);
               indRows.forEach((i: any) => {
                 if (i.general_industry_type && !inds.includes(i.general_industry_type)) inds.push(i.general_industry_type);
                 if (i.original_industry_input && !inds.includes(i.original_industry_input)) inds.push(i.original_industry_input);
               });
            }
            if (inds.length === 0) inds = ["Business Services"];

            const inferredCat = subcatMap.get(name) || (
              name.toLowerCase().includes("filipino") || 
              name.toLowerCase().includes("community") || 
              name.toLowerCase().includes("association") || 
              name.toLowerCase().includes("federation") ||
              name.toLowerCase().includes("org") 
                ? "Filipino Community Organizations" 
                : "Companies"
            );

            companyMap.set(name, {
              name,
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
              updatedAt: new Date(r.created_at || Date.now()).toLocaleDateString()
            });
          } else {
             const c = companyMap.get(name)!;
             c.leads += 1;
             if (r.industries) {
                const inds = r.industries.split(',').map((s: string) => s.replace(/[\[\]'"]/g, '').trim()).filter(Boolean);
                inds.forEach((ind: string) => {
                   if (!c.industries.includes(ind)) c.industries.push(ind);
                });
             }
          }
        });
        setCompanies(Array.from(companyMap.values()));
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
