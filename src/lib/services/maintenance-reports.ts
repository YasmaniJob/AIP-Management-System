// src/lib/services/maintenance-reports.ts
'use server';
import { dataService } from './data-service';
import { getIncidentsByStatus, getEquipmentStats } from '../data/incidents';
import { formatDistanceToNow, format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export interface MaintenanceRecommendation {
  id: string;
  resource_id: string;
  resource: {
    number: string;
    brand: string;
    model: string;
    category: { name: string; type: string };
  };
  recommendation_type: 'preventive' | 'corrective' | 'replacement' | 'inspection';

  title: string;
  description: string;
  estimated_cost?: number;
  estimated_duration?: number; // en horas
  due_date?: string;
  based_on_incidents: string[]; // IDs de incidencias
  created_at: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface MaintenanceReport {
  id: string;
  title: string;
  description: string;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'on_demand';
  period_start: string;
  period_end: string;
  generated_at: string;
  summary: {
    total_incidents: number;
    resolved_incidents: number;
    pending_incidents: number;
    critical_incidents: number;
    total_resources_affected: number;
    avg_resolution_time: number; // en horas
    maintenance_recommendations: number;
  };
  recommendations: MaintenanceRecommendation[];
  incident_analysis: {
    by_type: Record<string, number>;
    by_category: Record<string, number>;
    by_status: Record<string, number>;
    recurring_issues: Array<{
      resource_id: string;
      resource_info: string;
      incident_count: number;
      incident_types: string[];
    }>;
  };
  cost_analysis: {
    estimated_maintenance_cost: number;
    potential_savings: number;
    replacement_recommendations: Array<{
      resource_id: string;
      resource_info: string;
      reason: string;
      estimated_cost: number;
    }>;
  };
}

class MaintenanceReportsService {
  // Generar recomendaciones de mantenimiento basadas en historial
  async generateMaintenanceRecommendations(
    resourceId?: string,
    timeframe: 'last_month' | 'last_quarter' | 'last_year' = 'last_month'
  ): Promise<MaintenanceRecommendation[]> {
    try {
      const recommendations: MaintenanceRecommendation[] = [];
      
      // Funcionalidad de incidencias eliminada - las recomendaciones ahora se basan en otros criterios
      // como historial de mantenimiento, edad del equipo, etc.
      
      // Por ahora retornamos un array vacío hasta implementar la lógica completa
      return recommendations;
    } catch (error) {
      console.error('Error generating maintenance recommendations:', error);
      return [];
    }
  }
  
  // Generar reporte de mantenimiento completo
  async generateMaintenanceReport(
    reportType: 'monthly' | 'quarterly' | 'annual' | 'on_demand' = 'monthly',
    customPeriod?: { start: string; end: string }
  ): Promise<MaintenanceReport> {
    try {
      let periodStart: Date;
      let periodEnd: Date;
      
      if (customPeriod) {
        periodStart = new Date(customPeriod.start);
        periodEnd = new Date(customPeriod.end);
      } else {
        periodEnd = new Date();
        switch (reportType) {
          case 'monthly':
            periodStart = startOfMonth(subMonths(periodEnd, 1));
            periodEnd = endOfMonth(subMonths(periodEnd, 1));
            break;
          case 'quarterly':
            periodStart = subMonths(periodEnd, 3);
            break;
          case 'annual':
            periodStart = subMonths(periodEnd, 12);
            break;
          default:
            periodStart = subMonths(periodEnd, 1);
        }
      }
      
      // Obtener todas las incidencias del período
      const allIncidents = await dataService.findMany('incidents', {
        select: `
          *,
          resource:resources (
            id, number, brand, model,
            category:categories(name, type)
          )
        `,
        filters: {
          created_at: {
            gte: periodStart.toISOString(),
            lte: periodEnd.toISOString()
          }
        },
        orderBy: { created_at: 'desc' }
      });
      
      // Calcular estadísticas del resumen
      const totalIncidents = allIncidents.length;
      const resolvedIncidents = allIncidents.filter((i: any) => i.status === 'Resuelto').length;
      const pendingIncidents = allIncidents.filter((i: any) => i.status !== 'Resuelto').length;
      const criticalIncidents = allIncidents.filter((i: any) => 
        i.type === 'Daño' || i.type === 'Hardware'
      ).length;
      
      const uniqueResources = new Set(allIncidents.map((i: any) => i.resource_id)).size;
      
      // Calcular tiempo promedio de resolución
      const resolvedWithTimes = allIncidents.filter((i: any) => 
        i.status === 'Resuelto' && i.resolved_at
      );
      
      const avgResolutionTime = resolvedWithTimes.length > 0 
        ? resolvedWithTimes.reduce((acc: number, incident: any) => {
            const created = new Date(incident.created_at).getTime();
            const resolved = new Date(incident.resolved_at).getTime();
            return acc + (resolved - created);
          }, 0) / resolvedWithTimes.length / (1000 * 60 * 60) // convertir a horas
        : 0;
      
      // Generar recomendaciones de mantenimiento
      const recommendations = await this.generateMaintenanceRecommendations();
      
      // Análisis de incidencias
      const incidentAnalysis = {
        by_type: this.groupBy(allIncidents, 'type'),
        by_category: this.groupBy(allIncidents, (i: any) => i.resource?.category?.name || 'Sin categoría'),
        by_status: this.groupBy(allIncidents, 'status'),
        recurring_issues: this.findRecurringIssues(allIncidents)
      };
      
      // Análisis de costos
      const costAnalysis = {
        estimated_maintenance_cost: recommendations.reduce((acc, rec) => acc + (rec.estimated_cost || 0), 0),
        potential_savings: this.calculatePotentialSavings(allIncidents),
        replacement_recommendations: recommendations
          .filter(rec => rec.recommendation_type === 'replacement')
          .map(rec => ({
            resource_id: rec.resource_id,
            resource_info: `${rec.resource.category.name} ${rec.resource.number}`,
            reason: rec.description,
            estimated_cost: rec.estimated_cost || 0
          }))
      };
      
      const report: MaintenanceReport = {
        id: `report-${Date.now()}`,
        title: `Reporte de Mantenimiento ${this.getReportTitle(reportType)}`,
        description: `Reporte automático de mantenimiento basado en análisis de incidencias del período ${format(periodStart, 'dd/MM/yyyy', { locale: es })} - ${format(periodEnd, 'dd/MM/yyyy', { locale: es })}`,
        report_type: reportType,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        generated_at: new Date().toISOString(),
        summary: {
          total_incidents: totalIncidents,
          resolved_incidents: resolvedIncidents,
          pending_incidents: pendingIncidents,
          critical_incidents: criticalIncidents,
          total_resources_affected: uniqueResources,
          avg_resolution_time: Math.round(avgResolutionTime * 100) / 100,
          maintenance_recommendations: recommendations.length
        },
        recommendations,
        incident_analysis: incidentAnalysis,
        cost_analysis: costAnalysis
      };
      
      // Guardar el reporte en la base de datos
      await this.saveReport(report);
      
      return report;
    } catch (error) {
      console.error('Error generating maintenance report:', error);
      throw new Error('Error al generar el reporte de mantenimiento');
    }
  }
  
  // Obtener reportes existentes
  async getMaintenanceReports(
    limit = 10,
    offset = 0
  ): Promise<MaintenanceReport[]> {
    try {
      const reports = await dataService.findMany('maintenance_reports', {
        orderBy: { generated_at: 'desc' },
        limit,
        offset
      });
      
      return reports.map((report: any) => ({
        ...report,
        recommendations: JSON.parse(report.recommendations || '[]'),
        summary: JSON.parse(report.summary || '{}'),
        incident_analysis: JSON.parse(report.incident_analysis || '{}'),
        cost_analysis: JSON.parse(report.cost_analysis || '{}')
      }));
    } catch (error) {
      console.error('Error getting maintenance reports:', error);
      return [];
    }
  }
  
  // Métodos auxiliares
  private calculateEquipmentAge(resource: any): number {
    // Simulación - en un caso real, esto vendría de la fecha de adquisición
    return Math.floor(Math.random() * 10) + 1;
  }
  
  private groupBy(array: any[], key: string | ((item: any) => string)): Record<string, number> {
    return array.reduce((acc, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      acc[groupKey] = (acc[groupKey] || 0) + 1;
      return acc;
    }, {});
  }
  
  // Funcionalidad de análisis de incidencias eliminada
  private findRecurringIssues(): Array<{
    resource_id: string;
    resource_info: string;
    incident_count: number;
    incident_types: string[];
  }> {
    return [];
  }
  
  private calculatePotentialSavings(incidents: any[]): number {
    // Estimación de ahorros potenciales basada en mantenimiento preventivo
    const criticalIncidents = incidents.filter((i: any) => 
      i.type === 'Daño' || i.type === 'Hardware'
    ).length;
    
    return criticalIncidents * 300; // $300 por incidencia crítica evitada
  }
  
  private getReportTitle(reportType: string): string {
    switch (reportType) {
      case 'monthly': return 'Mensual';
      case 'quarterly': return 'Trimestral';
      case 'annual': return 'Anual';
      default: return 'Personalizado';
    }
  }
  
  private async saveReport(report: MaintenanceReport): Promise<void> {
    try {
      await dataService.create('maintenance_reports', {
        id: report.id,
        title: report.title,
        description: report.description,
        report_type: report.report_type,
        period_start: report.period_start,
        period_end: report.period_end,
        generated_at: report.generated_at,
        summary: JSON.stringify(report.summary),
        recommendations: JSON.stringify(report.recommendations),
        incident_analysis: JSON.stringify(report.incident_analysis),
        cost_analysis: JSON.stringify(report.cost_analysis)
      });
    } catch (error) {
      console.error('Error saving maintenance report:', error);
    }
  }
  
  // Programar generación automática de reportes
  async scheduleAutomaticReports(): Promise<void> {
    // En un entorno de producción, esto se ejecutaría con un cron job
    try {
      const now = new Date();
      const isFirstDayOfMonth = now.getDate() === 1;
      
      if (isFirstDayOfMonth) {
        // Generar reporte mensual automáticamente
        await this.generateMaintenanceReport('monthly');
        console.log('Reporte mensual generado automáticamente');
      }
      
      // Verificar si es primer día del trimestre
      const isFirstDayOfQuarter = isFirstDayOfMonth && [1, 4, 7, 10].includes(now.getMonth() + 1);
      
      if (isFirstDayOfQuarter) {
        // Generar reporte trimestral automáticamente
        await this.generateMaintenanceReport('quarterly');
        console.log('Reporte trimestral generado automáticamente');
      }
    } catch (error) {
      console.error('Error in automatic report generation:', error);
    }
  }
}

export const maintenanceReportsService = new MaintenanceReportsService();