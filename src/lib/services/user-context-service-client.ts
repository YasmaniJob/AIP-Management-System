'use client';
// src/lib/services/user-context-service-client.ts
// Versión cliente del servicio de contexto de usuario

import { createClient } from '../supabase/client';
import type { UserContextInfo, IncidentContext } from '../types/incident-context';

export class UserContextServiceClient {
  /**
   * Obtiene el contexto completo de un usuario desde el cliente
   */
  static async getUserContext(userId: string): Promise<UserContextInfo | null> {
    try {
      const supabase = createClient();
      
      // Obtener información básica del usuario
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return null;
      }

      // Obtener la reserva más reciente del usuario para inferir contexto
      const { data: recentBookings, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          activity,
          date,
          grade:grades (id, name),
          section:sections (id, name),
          area:areas (id, name),
          hour:pedagogical_hours (name)
        `)
        .eq('teacher_id', userId)
        .order('date', { ascending: false })
        .limit(1);

      if (bookingError) {
        console.error('Error fetching bookings:', bookingError);
      }

      const recentBooking = recentBookings?.[0];

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        currentGrade: recentBooking?.grade || undefined,
        currentSection: recentBooking?.section || undefined,
        currentArea: recentBooking?.area || undefined,
        recentBooking: recentBooking ? {
          id: recentBooking.id,
          activity: recentBooking.activity,
          date: recentBooking.date,
          pedagogicalHour: recentBooking.hour?.name
        } : undefined
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }

  /**
   * Obtiene el contexto de incidencia basado en el usuario actual
   */
  static async getIncidentContext(userId: string): Promise<IncidentContext> {
    const userContext = await this.getUserContext(userId);
    
    if (!userContext) {
      return {};
    }

    return {
      gradeId: userContext.currentGrade?.id,
      sectionId: userContext.currentSection?.id,
      areaId: userContext.currentArea?.id,
      bookingContext: userContext.recentBooking ? {
        bookingId: userContext.recentBooking.id,
        activity: userContext.recentBooking.activity,
        pedagogicalHour: userContext.recentBooking.pedagogicalHour,
        activityDate: userContext.recentBooking.date
      } : undefined
    };
  }

  /**
   * Obtiene información de contexto para mostrar en la UI
   */
  static async getContextDisplayInfo(context: IncidentContext): Promise<{
    grade?: string;
    section?: string;
    area?: string;
    activity?: string;
    pedagogicalHour?: string;
  }> {
    const result: any = {};
    const supabase = createClient();

    try {
      // Obtener nombres de grado, sección y área
      if (context.gradeId) {
        const { data: grade } = await supabase
          .from('grades')
          .select('name')
          .eq('id', context.gradeId)
          .single();
        result.grade = grade?.name;
      }

      if (context.sectionId) {
        const { data: section } = await supabase
          .from('sections')
          .select('name')
          .eq('id', context.sectionId)
          .single();
        result.section = section?.name;
      }

      if (context.areaId) {
        const { data: area } = await supabase
          .from('areas')
          .select('name')
          .eq('id', context.areaId)
          .single();
        result.area = area?.name;
      }

      // Información del contexto de reserva
      if (context.bookingContext) {
        result.activity = context.bookingContext.activity;
        result.pedagogicalHour = context.bookingContext.pedagogicalHour;
      }

      return result;
    } catch (error) {
      console.error('Error getting context display info:', error);
      return {};
    }
  }

  /**
   * Valida que el contexto proporcionado sea válido
   */
  static async validateContext(context: IncidentContext): Promise<boolean> {
    const supabase = createClient();
    
    try {
      // Validar que los IDs existan si están proporcionados
      if (context.gradeId) {
        const { data: grade } = await supabase
          .from('grades')
          .select('id')
          .eq('id', context.gradeId)
          .single();
        if (!grade) return false;
      }

      if (context.sectionId) {
        const { data: section } = await supabase
          .from('sections')
          .select('id')
          .eq('id', context.sectionId)
          .single();
        if (!section) return false;
      }

      if (context.areaId) {
        const { data: area } = await supabase
          .from('areas')
          .select('id')
          .eq('id', context.areaId)
          .single();
        if (!area) return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating context:', error);
      return false;
    }
  }
}

export const userContextServiceClient = UserContextServiceClient;