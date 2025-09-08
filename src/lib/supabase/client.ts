// src/lib/supabase/client.ts
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export const createClient = () =>
    createSupabaseBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
