import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabase/client";

export type DashboardUser = { email: string; name: string };

export type CountryData = {
  count: number;
  percentage: string;
  color: string;
  hex: string;
  companies: string[];
};

export type IndustryData = {
  count: number;
  percentage: string;
  color: string;
  hex: string;
};

export function getStoredUser(): DashboardUser | null {
  if (typeof window === "undefined") return null;
  try {
    const storedUser = localStorage.getItem("lifelead-user");
    return storedUser ? JSON.parse(storedUser) as DashboardUser : null;
  } catch {
    return null;
  }
}

export function useDashboardData() {
  const router = useRouter();
  const [user] = useState<DashboardUser | null>(getStoredUser);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lifelead-theme") === "dark";
    }
    return false;
  });
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [leadsType, setLeadsType] = useState("All Leads");
  const [rawRecords, setRawRecords] = useState<any[] | null>(null);


  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem("lifelead-theme", "dark");
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem("lifelead-theme", "light");
    }
  }, [isDarkMode]);

  const [stats, setStats] = useState({
    totalCompanies: 0,
    acceptedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    inactiveCount: 0,
    totalLeads: 0,
    totalCountries: 0,
    totalIndustries: 0,
    acceptedOfferCount: 0,
    monthlyAccepted: Array(12).fill(0),
    monthlyRejected: Array(12).fill(0),
  });

  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [allCompanyNames, setAllCompanyNames] = useState<string[]>([]);

  const [countriesData, setCountriesData] = useState<Record<string, CountryData>>({});
  const [industriesData, setIndustriesData] = useState<Record<string, IndustryData>>({});

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    const fetchSupabaseData = async () => {
      try {
        const { fetchAllCompanyContacts } = await import("../supabase/client");
        const { data: contactsData, error: contactsError } = await fetchAllCompanyContacts();

        if (contactsError) {
          console.warn("Supabase error loading contacts data:", contactsError.message);
          return;
        }

        setRawRecords(contactsData ?? []);
      } catch (err) {
        console.error("Connection failed:", err);
      }
    };

    if (!rawRecords) {
      fetchSupabaseData();
    }
    
    const handleUpdate = () => {
      fetchSupabaseData();
    };

    window.addEventListener('companyStatusUpdated', handleUpdate);
    return () => window.removeEventListener('companyStatusUpdated', handleUpdate);
  }, [router, user, rawRecords]);

  // Separate effect to process the data whenever raw data or filters change
  useEffect(() => {
    if (!rawRecords) return;

    try {
      // Apply Leads Type Filter
      const records = rawRecords.filter(r => {
        if (leadsType === "All Leads") return true;
        
        const inferredCat = r.category || "Companies";
        
        if (leadsType.includes("Filipino")) return inferredCat === "Filipino Community Organizations";
        return inferredCat === "Companies";
      });

      let pendingCount = 0;
      let acceptedCount = 0;
      let rejectedCount = 0;
      let inactiveCount = 0;

      const uniqueCountries = new Set<string>();
      const uniqueIndustries = new Set<string>();
      const uniqueSources = new Set<string>();
      const countryMap: Record<string, { count: number; companies: string[] }> = {};
      const industryCountMap: Record<string, number> = {};
      const monthlyAccepted = Array(12).fill(0);
      const monthlyRejected = Array(12).fill(0);

      records.forEach((record) => {
        if (record.source_file && record.source_file.trim() !== "") {
          uniqueSources.add(record.source_file.trim());
        }

        const status = record.status || "Not Active";
        if (status === "Pending") pendingCount++;
        else if (status === "Accepted") acceptedCount++;
        else if (status === "Rejected") rejectedCount++;
        else inactiveCount++;

        const country = record.country?.trim() || "Unknown";
        uniqueCountries.add(country);
        
        const name = record.company_name?.trim() || "Unknown Company";

        if (!countryMap[country]) {
          countryMap[country] = { count: 0, companies: [] };
        }
        countryMap[country].count++;
        // push unique company names to the country's companies list
        if (!countryMap[country].companies.includes(name)) {
           countryMap[country].companies.push(name);
        }

        let firstIndustry = "General";
        if (record.industries?.trim()) {
          const inds = record.industries.split(',').map((ind: string) => ind.replace(/[\[\]'"]/g, '').trim()).filter(Boolean);
          inds.forEach((ind: string) => uniqueIndustries.add(ind));
          if (inds.length > 0) firstIndustry = inds[0];
        }

        industryCountMap[firstIndustry] = (industryCountMap[firstIndustry] || 0) + 1;

        if (record.created_at) {
          const date = new Date(record.created_at);
          const month = date.getMonth(); 
          if (!isNaN(month)) {
            if (status === "Accepted") monthlyAccepted[month]++;
            if (status === "Rejected") monthlyRejected[month]++;
          }
        }
      });

      const total = records.length;
      
      // We want to extract unique names for autocomplete or other things if necessary
      const allNames = Array.from(new Set(records.map(r => r.company_name?.trim()).filter(Boolean)));
      
      setAvailableFiles(Array.from(uniqueSources).sort());
      setAllCompanyNames(allNames);

        setStats({
          totalCompanies: total,
          acceptedCount,
          pendingCount,
          rejectedCount,
          inactiveCount,
          totalLeads: total,
          totalCountries: uniqueCountries.size,
          totalIndustries: uniqueIndustries.size,
          acceptedOfferCount: acceptedCount,
          monthlyAccepted,
          monthlyRejected,
        });

        const colors = [
          { bg: "bg-[#046241]", hex: "#046241" },
          { bg: "bg-[#ffb347]", hex: "#ffb347" },
          { bg: "bg-[#133020]", hex: "#133020" },
          { bg: "bg-[#ffc370]", hex: "#ffc370" },
        ];

        const formattedCountries: Record<string, CountryData> = {};
        Object.entries(countryMap).forEach(([cName, cData], idx) => {
          const colorObj = colors[idx % colors.length];
          formattedCountries[cName] = {
            count: cData.count,
            percentage: `${Math.round((cData.count / total) * 100)}%`,
            color: colorObj.bg,
            hex: colorObj.hex,
            companies: cData.companies
          };
        });

        setCountriesData(formattedCountries);

        const formattedIndustries: Record<string, IndustryData> = {};
        Object.entries(industryCountMap).sort((a,b)=>b[1]-a[1]).forEach(([iName, count], idx) => {
          const colorObj = colors[idx % colors.length];
          formattedIndustries[iName] = {
            count: count,
            percentage: `${Math.round((count / total) * 100)}%`,
            color: colorObj.bg,
            hex: colorObj.hex,
          };
        });
        setIndustriesData(formattedIndustries);
    } catch (err) {
      console.error("Data processing failed:", err);
    }
  }, [rawRecords, leadsType]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("lifelead-user");
    router.push("/");
  };

  return {
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
    allCompanyNames,
    leadsType,
    setLeadsType,
    rawRecords,
  };
}
