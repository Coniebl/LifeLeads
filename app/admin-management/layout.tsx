import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export default async function AdminManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Verify the user has a valid active session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    redirect("/"); // Not logged in, send to login page
  }

  // 2. Fetch the user's role securely on the server
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  // 3. If they don't exist or aren't an admin, kick them out
  if (profileError || !profile || profile.role !== "admin") {
    redirect("/dashboard"); // Standard user, send to dashboard
  }

  // If we reach this point, the user is mathematically proven to be an admin on the server side.
  // The client will now be allowed to download the admin page code.
  return <>{children}</>;
}
