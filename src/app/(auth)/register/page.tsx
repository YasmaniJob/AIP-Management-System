import { RegisterForm } from '@/components/auth/register-form';
import { createServerClient } from '@/lib/supabase/server';
import { getSystemSettings } from '@/lib/data/settings';
import { redirect } from 'next/navigation';

// Evitar prerendering estático debido al uso de cookies
export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
    const settings = await getSystemSettings();

    // If there is no settings row, it means no admin has registered yet.
    // In this case, the first user to register MUST be an admin.
    if (!settings) {
        // Here you might want a specific "Admin Registration Form"
        // For simplicity, we'll reuse the same form and the logic
        // in the action will handle making them an Admin.
        return <RegisterForm settings={settings} />;
    }

    // If settings exist but registration is closed, redirect.
    if (!settings.allow_registration) {
       redirect('/');
    }

    // Otherwise, show the normal registration form for teachers.
    return <RegisterForm settings={settings} />;
}