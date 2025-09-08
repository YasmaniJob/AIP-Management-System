// src/lib/services/user-context-service.ts
// Servicio centralizado para manejar el contexto de usuario

import { dataService } from './data-service';
import type { UserContextInfo, IncidentContext } from '../types/incident-context';

export class UserContextService {
  /**
   * Obtiene el contexto completo de un usuario
   */
  static async getUserContext(userId: string): Promise<UserContextInfo | null> {
    try {
      // Obtener información básica del usuario
      const user = await dataService.findById('users', userId, {
        select: 'id, name, email, role'
      });

      if (!user) {
        return null;
      }

      // Obtener la reserva más reciente del usuario para inferir contexto
      const recentBookings = await dataService.findMany('bookings', {
        select: `
          id,
          activity,
          date,
          grade:grades (id, name),
          section:sections (id, name),
          area:areas (id, name),
          hour:pedagogical_hours (name)
        `,
        filters: { teacher_id: userId },
        orderBy: { date: 'desc' },
        limit: 1
      });

      const recentBooking = recentBookings[0];

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

    try {
      // Obtener nombres de grado, sección y área
      if (context.gradeId) {
        const grade = await dataService.findById('grades', context.gradeId, {
          select: 'name'
        });
        result.grade = grade?.name;
      }

      if (context.sectionId) {
        const section = await dataService.findById('sections', context.sectionId, {
          select: 'name'
        });
        result.section = section?.name;
      }

      if (context.areaId) {
        const area = await dataService.findById('areas', context.areaId, {
          select: 'name'
        });
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
    try {
      // Validar que los IDs existan si están proporcionados
      if (context.gradeId) {
        const grade = await dataService.findById('grades', context.gradeId);
        if (!grade) return false;
      }

      if (context.sectionId) {
        const section = await dataService.findById('sections', context.sectionId);
        if (!section) return false;
      }

      if (context.areaId) {
        const area = await dataService.findById('areas', context.areaId);
        if (!area) return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating context:', error);
      return false;
    }
  }
}

export const userContextService = UserContextService;