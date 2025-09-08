import { AppShell } from "@/components/layout/app-shell";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Evitar prerendering estático debido al uso de cookies
export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  // Layout - userId from cookie

  if (!userId) {
    redirect('/');
  }

  const supabase = await createServerClient();
  
  // Only check if user exists in database, avoid auth verification to prevent rate limits
  const { data: user, error } = await supabase.from('users').select('role').eq('id', userId).single();

  if (error || !user) {
    // User doesn't exist in database, clear cookie and redirect to login
    // User not found in database
    redirect('/');
  }
  
  return (
    <AppShell userRole={user.role} userId={userId}>
        {children}
    </AppShell>
  );
}