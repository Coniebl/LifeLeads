import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export type CompanyStatus = "Pending" | "Accepted" | "Rejected";

export function useCompanyStatus(companyName: string) {
  const [status, setStatusState] = useState<CompanyStatus>("Pending");

  useEffect(() => {
    if (typeof window === 'undefined' || !companyName) return;

    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('company_contacts')
        .select('status')
        .eq('company_name', companyName)
        .limit(1);

      if (!error && data && data.length > 0) {
        setStatusState(data[0].status as CompanyStatus || "Pending");
      }
    };

    fetchStatus();

    const handleUpdate = () => fetchStatus();
    window.addEventListener('companyStatusUpdated', handleUpdate);
    return () => window.removeEventListener('companyStatusUpdated', handleUpdate);
  }, [companyName]);

  const setStatus = async (newStatus: CompanyStatus) => {
    setStatusState(newStatus);
    
    const { data, error } = await supabase
      .from('company_contacts')
      .update({ status: newStatus })
      .eq('company_name', companyName)
      .select();

    if (error) {
      console.error("Supabase update error:", error.message);
      alert("Failed to update status. Error: " + error.message);
    } else if (!data || data.length === 0) {
      console.error("No rows updated. This is usually caused by missing RLS UPDATE policies!");
      alert("Status could not be updated. Your database Row Level Security (RLS) is blocking the update. Please ensure you created the UPDATE policy for company_contacts.");
    } else {
      window.dispatchEvent(new Event('companyStatusUpdated'));
    }
  };

  return { status, setStatus };
}

export function useAllCompanyStatuses() {
  const [statuses, setStatuses] = useState<Record<string, CompanyStatus>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fetchStatuses = async () => {
      const { data, error } = await supabase.from('company_contacts').select('company_name, status');
      if (!error && data) {
        const overrides: Record<string, CompanyStatus> = {};
        data.forEach(row => {
          if (row.company_name) {
            overrides[row.company_name] = row.status as CompanyStatus || "Pending";
          }
        });
        setStatuses(overrides);
      }
    };
    fetchStatuses();
    window.addEventListener('companyStatusUpdated', fetchStatuses);
    return () => window.removeEventListener('companyStatusUpdated', fetchStatuses);
  }, []);

  return statuses;
}
