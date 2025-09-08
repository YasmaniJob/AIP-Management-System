// RESPALDO DE LA PÁGINA DE REGISTRO ORIGINAL
// Fecha: $(date)
// Motivo: Recreación completa del formulario de registro

// src/app/(auth)/register/page.tsx
import { RegisterForm } from '@/components/auth/register-form';
import { createServerClient } from '@/lib/supabase/server';
import { getSystemSettings } from '@/lib/data/settings';
import { redirect } from 'next/navigation';

export default async function RegisterPage() {
    const settings = await getSystemSettings();

    // If there is no settings row, it means no admin has registered yet.
    // In this case, the first user to register MUST be an admin.
    if (!settings) {
        // Here you might want a specific "Admin Registration Form"
        // For simplicity, we'll reuse the same form and the logic
        // in the action will handle making them an Admin.
        return <RegisterForm />;
    }

    // If settings exist but registration is closed, redirect.
    if (!settings.allow_registration) {
       redirect('/');
    }

    // Otherwise, show the normal registration form for teachers.
    return <RegisterForm />;
}