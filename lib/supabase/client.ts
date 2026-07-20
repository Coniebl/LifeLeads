import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !anonKey) {
    throw new Error(
      "@supabase/ssr: Your project's URL and API key are required to create a Supabase client.\n" +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in your environment.'
    )
  }

  return createBrowserClient(url, anonKey)
}

export const supabase = createClient()

export async function fetchAllCompanyContacts(orderBy: { column: string, ascending: boolean } | null = null) {
  let allData: any[] = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    let query = supabase.from('company_contacts').select('*');
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }
    const { data, error } = await query.range(from, from + step - 1);
    
    if (error) {
      console.error("Error fetching company_contacts:", error);
      return { data: null, error };
    }
    
    if (!data || data.length === 0) break;
    
    allData = allData.concat(data);
    if (data.length < step) break;
    
    from += step;
  }
  
  return { data: allData, error: null };
}
