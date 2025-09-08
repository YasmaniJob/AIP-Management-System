// src/lib/data/settings.ts
'use server';

import { createServerClient } from '../supabase/server';
import type { GradeWithSections, Area, PedagogicalHour, SystemSettings } from '../types';

export async function getAreas(): Promise<Area[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('areas').select('*').order('name');
  if (error) {
    console.error('Error fetching areas:', error);
    return [];
  }
  return data;
}

export async function getGradesWithSections(): Promise<GradeWithSections[]> {
    try {
        const supabase = await createServerClient();
        
        // First, verify the connection and table access
        const { data: grades, error: gradesError } = await supabase
            .from('grades')
            .select('*')
            .order('name');
            
        if (gradesError) {
            console.error('Error fetching grades:', {
                message: gradesError.message,
                code: gradesError.code,
                details: gradesError.details,
                hint: gradesError.hint
            });
            return [];
        }
        
        // If no grades found, return empty array
        if (!grades || grades.length === 0) {
            console.warn('No grades found in the database');
            return [];
        }
        
        // Now fetch grades with sections
        const { data, error } = await supabase
            .from('grades')
            .select(`
                *,
                sections (
                    *
                )
            `)
            .order('name');

        if (error) {
            console.error('Error fetching grades with sections:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            return [];
        }

        // Sort sections alphabetically within each grade
        if (data && data.length > 0) {
            for (const grade of data) {
                if (grade.sections && Array.isArray(grade.sections)) {
                    grade.sections.sort((a, b) => a.name.localeCompare(b.name));
                } else {
                    console.warn(`Grade ${grade.id} has no sections or invalid sections data`);
                    grade.sections = [];
                }
            }
        }
        
        return data || [];
    } catch (error) {
        console.error('Unexpected error in getGradesWithSections:', error);
        return [];
    }
}

export async function getPedagogicalHours(): Promise<PedagogicalHour[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from('pedagogical_hours').select('*').order('hour_order');
    if (error) {
      console.error('Error fetching hours:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Unexpected error in getPedagogicalHours:', error);
    return [];
  }
}

export async function getSystemSettings(): Promise<SystemSettings | null> {
    try {
        const supabase = await createServerClient();
        const { data, error } = await supabase.from('system_settings').select('*').single();
        
        if (error) {
            console.warn('Warning: Could not fetch system settings:', {
                code: error.code,
                message: error.message
            });
            
            // Return default settings for any error (including connectivity issues)
            return {
                id: 1,
                allow_registration: false,
                app_name: 'AIP Manager',
                app_logo_url: null,
                primary_color: '#3b82f6',
                accent_color: '#10b981',
                theme_preset: 'default',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as SystemSettings;
        }
        
        return data;
    } catch (error) {
        console.warn('Warning: Unexpected error fetching system settings:', {
            message: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Return default settings for any unexpected error
        return {
            id: 1,
            allow_registration: false,
            app_name: 'AIP Manager',
            app_logo_url: null,
            primary_color: '#3b82f6',
            accent_color: '#10b981',
            theme_preset: 'default',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as SystemSettings;
    }
}
