// src/app/page.tsx
import { redirect } from 'next/navigation';
import { LoginPageClient } from '@/components/auth/login-page-client';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getSystemSettings } from '@/lib/data/settings';

// Evitar prerendering estático debido al uso de cookies
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  // LoginPage - userId from cookie

  // If user has a valid session, verify they exist in database before redirecting
  if (userId) {
    const supabase = await createServerClient();
    const { data: user } = await supabase.from('users').select('id').eq('id', userId).single();
    
    if (user) {
      redirect('/dashboard');
    }
    // If user doesn't exist in database, clear the cookie and show login form
  }

  const resolvedSearchParams = await searchParams;
  const showRegistrationSuccess = resolvedSearchParams.registered === 'true';
  
  // Get system settings from server
  const settings = await getSystemSettings();

  return <LoginPageClient showRegistrationSuccess={showRegistrationSuccess} settings={settings} />;
}