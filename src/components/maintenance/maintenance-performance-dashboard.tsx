// src/components/maintenance/maintenance-performance-dashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Monitor,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Wifi,
  HardDrive,
  Cpu
} from 'lucide-react';
import {
  performanceMonitor,
  MaintenancePerformanceStats,
  PerformanceAlert
} from '@/lib/monitoring/maintenance-performance';
import { cn } from '@/lib/utils';

// =====================================================
// COMPONENTE DE MÉTRICA
// =====================================================

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  threshold?: {
    warning: number;
    critical: number;
  };
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, unit, icon: Icon, color, threshold, trend }: MetricCardProps) {
  const getStatus = () => {
    if (!threshold) return 'normal';
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
  };

  const status = getStatus();
  const statusColors = {
    normal: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  const formatValue = (val: number) => {
    if (unit === 'ms') {
      return val < 1000 ? `${val.toFixed(0)}ms` : `${(val / 1000).toFixed(1)}s`;
    }
    if (unit === 'percentage') {
      return `${(val * 100).toFixed(1)}%`;
    }
    if (unit === 'ratio') {
      return `${(val * 100).toFixed(1)}%`;
    }
    return val.toFixed(2);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className={cn("text-2xl font-bold", statusColors[status])}>
                {formatValue(value)}
              </p>
              {status !== 'normal' && (
                <AlertTriangle className={cn("h-4 w-4", statusColors[status])} />
              )}
            </div>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(trend.value).toFixed(1)}%
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-full", color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        
        {threshold && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Normal</span>
              <span>Crítico</span>
            </div>
            <Progress 
              value={Math.min((value / threshold.critical) * 100, 100)}
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// COMPONENTE DE ALERTAS
// =====================================================

interface AlertsPanelProps {
  alerts: PerformanceAlert[];
  onResolveAlert: (alertId: string) => void;
}

function AlertsPanel({ alerts, onResolveAlert }: AlertsPanelProps) {
  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.type === 'critical');
  const warningAlerts = activeAlerts.filter(alert => alert.type === 'warning');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alertas de Rendimiento
          {activeAlerts.length > 0 && (
            <Badge variant="destructive">{activeAlerts.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeAlerts.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mr-2 text-green-500" />
            No hay alertas activas
          </div>
        ) : (
          <div className="space-y-3">
            {criticalAlerts.map((alert) => (
              <Alert key={alert.id} className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="flex items-center justify-between w-full">
                  <div>
                    <AlertDescription className="text-red-800">
                      <strong>CRÍTICO:</strong> {alert.message}
                    </AlertDescription>
                    <p className="text-xs text-red-600 mt-1">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResolveAlert(alert.id)}
                  >
                    Resolver
                  </Button>
                </div>
              </Alert>
            ))}
            
            {warningAlerts.map((alert) => (
              <Alert key={alert.id} className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div className="flex items-center justify-between w-full">
                  <div>
                    <AlertDescription className="text-yellow-800">
                      <strong>ADVERTENCIA:</strong> {alert.message}
                    </AlertDescription>
                    <p className="text-xs text-yellow-600 mt-1">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResolveAlert(alert.id)}
                  >
                    Resolver
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// COMPONENTE DE CONSULTAS LENTAS
// =====================================================

interface SlowQueriesPanelProps {
  queries: any[];
}

function SlowQueriesPanel({ queries }: SlowQueriesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Consultas Lentas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {queries.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mr-2 text-green-500" />
            No hay consultas lentas
          </div>
        ) : (
          <div className="space-y-3">
            {queries.map((query, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={query.executionTime > 3000 ? "destructive" : "secondary"}>
                    {query.executionTime}ms
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{query.rowsAffected} filas</span>
                    <span>•</span>
                    <span>{query.cacheHit ? 'Cache HIT' : 'Cache MISS'}</span>
                  </div>
                </div>
                <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                  {query.query}
                </code>
                <p className="text-xs text-muted-foreground">
                  {query.timestamp.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function MaintenancePerformanceDashboard() {
  const [stats, setStats] = useState<MaintenancePerformanceStats | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    // Cargar datos iniciales
    loadData();

    // Suscribirse a actualizaciones
    const unsubscribe = performanceMonitor.subscribe((newStats) => {
      setStats(newStats);
      setLastUpdate(new Date());
    });

    // Actualizar alertas cada 10 segundos
    const alertInterval = setInterval(() => {
      setAlerts(performanceMonitor.getAlerts());
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(alertInterval);
    };
  }, []);

  // =====================================================
  // FUNCIONES
  // =====================================================

  const loadData = () => {
    setIsLoading(true);
    try {
      const currentStats = performanceMonitor.getStats();
      const currentAlerts = performanceMonitor.getAlerts();
      
      setStats(currentStats);
      setAlerts(currentAlerts);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = (alertId: string) => {
    performanceMonitor.resolveAlert(alertId);
    setAlerts(performanceMonitor.getAlerts());
  };

  const handleRefresh = () => {
    loadData();
  };

  const exportData = () => {
    const data = performanceMonitor.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance-performance-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Rendimiento</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No se pudieron cargar las métricas de rendimiento.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Rendimiento</h1>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real del sistema de mantenimiento
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Activity className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Alertas críticas */}
      {alerts.filter(a => !a.resolved && a.type === 'critical').length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>¡Atención!</strong> Hay {alerts.filter(a => !a.resolved && a.type === 'critical').length} alertas críticas que requieren atención inmediata.
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Tiempo Promedio de Consulta"
          value={stats.avgQueryTime}
          unit="ms"
          icon={Database}
          color="bg-blue-500"
          threshold={{ warning: 1000, critical: 3000 }}
        />
        
        <MetricCard
          title="Tasa de Acierto de Caché"
          value={stats.cacheHitRate}
          unit="ratio"
          icon={Zap}
          color="bg-green-500"
          threshold={{ warning: 0.8, critical: 0.6 }}
        />
        
        <MetricCard
          title="Tiempo de Renderizado"
          value={stats.componentRenderTime}
          unit="ms"
          icon={Monitor}
          color="bg-purple-500"
          threshold={{ warning: 100, critical: 300 }}
        />
        
        <MetricCard
          title="Tiempo de Carga"
          value={stats.dataLoadTime}
          unit="ms"
          icon={Clock}
          color="bg-orange-500"
          threshold={{ warning: 2000, critical: 5000 }}
        />
        
        <MetricCard
          title="Latencia de Interacción"
          value={stats.userInteractionLatency}
          unit="ms"
          icon={Activity}
          color="bg-indigo-500"
        />
        
        <MetricCard
          title="Tasa de Error"
          value={stats.errorRate}
          unit="ratio"
          icon={AlertTriangle}
          color="bg-red-500"
          threshold={{ warning: 0.05, critical: 0.1 }}
        />
        
        <MetricCard
          title="Uso de Memoria"
          value={stats.memoryUsage}
          unit="percentage"
          icon={HardDrive}
          color="bg-yellow-500"
          threshold={{ warning: 0.8, critical: 0.9 }}
        />
        
        <MetricCard
          title="Latencia de Red"
          value={stats.networkLatency}
          unit="ms"
          icon={Wifi}
          color="bg-cyan-500"
        />
      </div>

      {/* Tabs con detalles */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="queries">Consultas Lentas</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="alerts">
          <AlertsPanel alerts={alerts} onResolveAlert={handleResolveAlert} />
        </TabsContent>
        
        <TabsContent value="queries">
          <SlowQueriesPanel queries={stats.slowQueries} />
        </TabsContent>
        
        <TabsContent value="system">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Recursos del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memoria</span>
                    <span>{(stats.memoryUsage * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.memoryUsage * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU</span>
                    <span>{(stats.cpuUsage * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.cpuUsage * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Métricas de Negocio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tiempo de Procesamiento</span>
                  <span className="font-medium">{stats.maintenanceProcessingTime.toFixed(0)}ms</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tasa de Completación</span>
                  <span className="font-medium">{(stats.completionRate * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}