"use client";

import React, { useState } from "react";
import { PipelineView } from "../../components/pipeline/PipelineView";
import type { CompanyData } from "../../components/leads/CompanyCard";

export default function PipelinePage() {
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

          const rawCat = r.category || "Companies";
          const inferredCat = rawCat === "Scraped Companies" ? "Companies" : rawCat === "Scraped Orgs" ? "Filipino Community Organizations" : rawCat;

          return {
            id: r.id,
            name: r.company_name,
            industries: inds,
            country: r.country || "Global",
            aiServiceIntent: r.description || undefined,
            description: r.description || "",
            employeeCount: r.employee_count || 10,
            email: r.contact_email || undefined,
            telephone: r.contact_telephone || undefined,
            mobile: r.contact_mobile || undefined,
            contactPerson: r.contact_person || undefined,
            contactPersonTitle: r.contact_person_title || undefined,
            type: inferredCat,
            dateAdded: r.created_at,
            status: r.status,
            source: r.source_file,
            leads: 0,
          };
        });

        // Pipeline only shows 'Hot Lead' and 'Cold Lead'
        const pipelineCompanies = mappedCompanies.filter(c => c.status === 'Hot Lead' || c.status === 'Cold Lead');
        setCompanies(pipelineCompanies);
      }
    };
    fetchCompanies();
  }, []);

  return (
    <React.Suspense fallback={<div>Loading Pipeline...</div>}>
      <PipelineView companies={companies} />
    </React.Suspense>
  );
}
