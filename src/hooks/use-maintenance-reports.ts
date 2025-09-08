// src/hooks/use-maintenance-reports.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { maintenanceReportsService, type MaintenanceReport, type MaintenanceRecommendation } from '@/lib/services/maintenance-reports';
import { toast } from 'sonner';

interface UseMaintenanceReportsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  limit?: number;
}

interface UseMaintenanceReportsReturn {
  reports: MaintenanceReport[];
  loading: boolean;
  error: string | null;
  selectedReport: MaintenanceReport | null;
  generating: boolean;
  refreshReports: () => Promise<void>;
  generateReport: (type: 'monthly' | 'quarterly' | 'annual' | 'on_demand') => Promise<MaintenanceReport | null>;
  selectReport: (report: MaintenanceReport | null) => void;
  getReportById: (id: string) => MaintenanceReport | undefined;
}

export function useMaintenanceReports(options: UseMaintenanceReportsOptions = {}): UseMaintenanceReportsReturn {
  const {
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutos
    limit = 20
  } = options;

  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<MaintenanceReport | null>(null);
  const [generating, setGenerating] = useState(false);

  const refreshReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await maintenanceReportsService.getMaintenanceReports(limit);
      setReports(data);
      
      // Si hay un reporte seleccionado, actualizarlo con la nueva data
      if (selectedReport) {
        const updatedReport = data.find(r => r.id === selectedReport.id);
        if (updatedReport) {
          setSelectedReport(updatedReport);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar reportes';
      setError(errorMessage);
      console.error('Error loading maintenance reports:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, selectedReport]);

  const generateReport = useCallback(async (type: 'monthly' | 'quarterly' | 'annual' | 'on_demand'): Promise<MaintenanceReport | null> => {
    try {
      setGenerating(true);
      setError(null);
      
      const newReport = await maintenanceReportsService.generateMaintenanceReport(type);
      
      // Actualizar la lista de reportes
      setReports(prev => [newReport, ...prev]);
      
      // Seleccionar el nuevo reporte
      setSelectedReport(newReport);
      
      toast.success('Reporte generado exitosamente');
      return newReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar reporte';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error generating report:', err);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const selectReport = useCallback((report: MaintenanceReport | null) => {
    setSelectedReport(report);
  }, []);

  const getReportById = useCallback((id: string): MaintenanceReport | undefined => {
    return reports.find(report => report.id === id);
  }, [reports]);

  // Cargar reportes inicialmente
  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshReports();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshReports]);

  // Seleccionar el primer reporte automáticamente si no hay ninguno seleccionado
  useEffect(() => {
    if (reports.length > 0 && !selectedReport) {
      setSelectedReport(reports[0]);
    }
  }, [reports, selectedReport]);

  return {
    reports,
    loading,
    error,
    selectedReport,
    generating,
    refreshReports,
    generateReport,
    selectReport,
    getReportById
  };
}

// Hook simplificado para obtener solo estadísticas de reportes
export function useMaintenanceReportsStats() {
  const [stats, setStats] = useState({
    totalReports: 0,
    reportsThisMonth: 0,
    totalRecommendations: 0,
    criticalRecommendations: 0,
    estimatedSavings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const reports = await maintenanceReportsService.getMaintenanceReports(50);
        
        const now = new Date();
        const thisMonth = reports.filter(report => {
          const reportDate = new Date(report.generated_at);
          return reportDate.getMonth() === now.getMonth() && 
                 reportDate.getFullYear() === now.getFullYear();
        });

        const totalRecommendations = reports.reduce((sum, report) => 
          sum + report.recommendations.length, 0
        );
        
        const criticalRecommendations = reports.reduce((sum, report) => 
          sum + report.recommendations.filter(r => r.priority === 'critical').length, 0
        );
        
        const estimatedSavings = reports.reduce((sum, report) => 
          sum + report.cost_analysis.potential_savings, 0
        );

        setStats({
          totalReports: reports.length,
          reportsThisMonth: thisMonth.length,
          totalRecommendations,
          criticalRecommendations,
          estimatedSavings
        });
      } catch (error) {
        console.error('Error loading maintenance reports stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return { stats, loading };
}

// Hook para generar reportes programados
export function useScheduledReports() {
  const [isScheduling, setIsScheduling] = useState(false);

  const scheduleReport = useCallback(async (type: 'monthly' | 'quarterly' | 'annual') => {
    try {
      setIsScheduling(true);
      
      // Aquí se podría implementar la lógica para programar reportes automáticos
      // Por ahora, simplemente generamos un reporte
      await maintenanceReportsService.generateMaintenanceReport(type);
      
      toast.success(`Reporte ${type} programado exitosamente`);
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast.error('Error al programar el reporte');
    } finally {
      setIsScheduling(false);
    }
  }, []);

  return {
    scheduleReport,
    isScheduling
  };
}