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
  const [leadsType, setLeadsType] = useState("All Types");
  const [rawRecords, setRawRecords] = useState<any[] | null>(null);
  const [rawIndustries, setRawIndustries] = useState<any[] | null>(null);

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
        const { data: contactsData, error: contactsError } = await supabase.from("company_contacts").select("*");
        const { data: indData, error: indError } = await supabase.from("company_industries").select("*");

        if (contactsError) {
          console.warn("Supabase error loading contacts data:", contactsError.message);
          return;
        }

        setRawRecords(contactsData ?? []);
        setRawIndustries(indData ?? []);
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
    if (!rawRecords || !rawIndustries) return;

    try {
      // Apply Leads Type Filter
      const records = rawRecords.filter(r => {
        if (leadsType === "All Types") return true;
        const category = r.category || "Companies";
        if (leadsType.includes("Filipino")) return category === "Filipino Community Organizations";
        return category === "Companies";
      });

      const industryRecords = rawIndustries;
      
      const companies = new Map<string, { country: string; industries: Set<string>; leads: number; status: string; created_at?: string }>();
        const companyToGenIndustry = new Map<string, string>();
        
        industryRecords.forEach(ir => {
          if (ir.company_name && ir.general_industry_type) {
            companyToGenIndustry.set(ir.company_name.trim(), ir.general_industry_type.trim());
          }
        });
        
        let pendingCount = 0;
        let acceptedCount = 0;
        let rejectedCount = 0;
        let inactiveCount = 0;

        records.forEach((record) => {
          if (!record.company_name?.trim()) return;
          const name = record.company_name.trim();

          if (!companies.has(name)) {
            companies.set(name, { 
              country: record.country?.trim() || "Unknown", 
              industries: new Set<string>(), 
              leads: 0,
              status: record.status,
              created_at: record.created_at
            });
          }

          const company = companies.get(name)!;
          company.leads += 1;

          if (record.industries?.trim()) {
            record.industries.split(',').forEach((ind: string) => {
              const cleaned = ind.replace(/[\[\]'"]/g, '').trim();
              if (cleaned) company.industries.add(cleaned);
            });
          }
        });

        companies.forEach((company) => {
          if (company.status === "Pending") pendingCount++;
          else if (company.status === "Accepted") acceptedCount++;
          else if (company.status === "Rejected") rejectedCount++;
          else if (!company.status || company.status === "Not Active") inactiveCount++;
        });

        // We removed the early return if (companies.size === 0) return; so it properly resets stats to 0

        const total = companies.size;
        const leadsSum = records.length;
        const uniqueCountries = new Set<string>();
        const uniqueIndustries = new Set<string>();
        const uniqueSources = new Set<string>();

        const countryMap: Record<string, { count: number; companies: string[] }> = {};
        const industryCountMap: Record<string, number> = {};
        const monthlyAccepted = Array(12).fill(0);
        const monthlyRejected = Array(12).fill(0);

        records.forEach(r => {
          if (r.source_file && r.source_file.trim() !== "") {
            uniqueSources.add(r.source_file.trim());
          }
        });
        setAvailableFiles(Array.from(uniqueSources).sort());
        setAllCompanyNames(Array.from(companies.keys()));

        companies.forEach((company, name) => {
          const country = company.country;
          uniqueCountries.add(country);
          company.industries.forEach((industry) => uniqueIndustries.add(industry));

          if (!countryMap[country]) {
            countryMap[country] = { count: 0, companies: [] };
          }
          countryMap[country].count++;
          countryMap[country].companies.push(name);
          
          const genIndustry = companyToGenIndustry.get(name) || "Other";
          industryCountMap[genIndustry] = (industryCountMap[genIndustry] || 0) + 1;
          
          // Add to monthly chart if created_at exists AND it's accepted or rejected
          if (company.created_at) {
            const date = new Date(company.created_at);
            const month = date.getMonth(); 
            if (!isNaN(month)) {
              if (company.status === "Accepted") monthlyAccepted[month]++;
              if (company.status === "Rejected") monthlyRejected[month]++;
            }
          }
        });

        setStats({
          totalCompanies: total,
          acceptedCount,
          pendingCount,
          rejectedCount,
          inactiveCount,
          totalLeads: inactiveCount,
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
  }, [rawRecords, rawIndustries, leadsType]);

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
