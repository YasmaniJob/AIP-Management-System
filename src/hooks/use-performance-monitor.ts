'use client';

import { useEffect, useState } from 'react';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

// Hook React para usar el monitor
export function usePerformanceMonitor() {
  const [stats, setStats] = useState(performanceMonitor.getStats());
  const [alerts, setAlerts] = useState(performanceMonitor.getAlerts());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(performanceMonitor.getStats());
      setAlerts(performanceMonitor.getAlerts());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const clearAlerts = () => {
    performanceMonitor.clearAlerts();
    setAlerts([]);
  };

  const generateReport = () => {
    return performanceMonitor.generateReport();
  };

  return {
    stats,
    alerts,
    clearAlerts,
    generateReport,
    monitor: performanceMonitor
  };
}