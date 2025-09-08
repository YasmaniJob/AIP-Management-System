'use client';

import { LoginForm } from './login-form';
import type { Database } from '@/lib/supabase/database.types';

type SystemSettings = Database['public']['Tables']['system_settings']['Row'];

interface LoginPageClientProps {
  showRegistrationSuccess?: boolean;
  settings?: SystemSettings | null;
}

export function LoginPageClient({ showRegistrationSuccess, settings }: LoginPageClientProps) {
  return <LoginForm showRegistrationSuccess={showRegistrationSuccess} settings={settings} />;
}