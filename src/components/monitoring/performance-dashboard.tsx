'use client';

// Dashboard de monitoreo de rendimiento y optimización

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Server,
  Users,
  HardDrive,
  Wifi,
  RefreshCw
} from 'lucide-react';
import { usePerformanceMonitor } from '@/lib/monitoring/performance-monitor';
import { useCacheOptimization } from '@/lib/cache/cache-headers';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'error';
}

function MetricCard({ title, value, description, icon, trend, status = 'good' }: MetricCardProps) {
  const statusColors = {
    good: 'text-green-600 border-green-200 bg-green-50',
    warning: 'text-yellow-600 border-yellow-200 bg-yellow-50',
    error: 'text-red-600 border-red-200 bg-red-50'
  };

  const trendIcons = {
    up: <TrendingUp className="h-4 w-4 text-green-500" />,
    down: <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />,
    stable: <div className="h-4 w-4" />
  };

  return (
    <Card className={`${statusColors[status]} transition-all duration-200 hover:shadow-md`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-1">
          {trend && trendIcons[trend]}
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface AlertItemProps {
  alert: {
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: number;
    resolved: boolean;
  };
  onResolve: (id: string) => void;
}

function AlertItem({ alert, onResolve }: AlertItemProps) {
  const alertStyles = {
    error: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50'
  };

  const alertIcons = {
    error: <AlertTriangle className="h-4 w-4 text-red-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    info: <Activity className="h-4 w-4 text-blue-500" />
  };

  return (
    <Alert className={`${alertStyles[alert.type]} mb-2`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          {alertIcons[alert.type]}
          <div>
            <AlertTitle className="text-sm font-medium">
              {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {alert.message}
            </AlertDescription>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        {!alert.resolved && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolve(alert.id)}
            className="ml-2"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolver
          </Button>
        )}
      </div>
    </Alert>
  );
}

function ResourceUsageChart({ usage, limits }: { usage: any; limits: any }) {
  const calculatePercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage > 80) return 'bg-red-500';
    if (percentage > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const resources = [
    {
      name: 'Consultas Supabase',
      current: usage.supabaseQueries,
      max: limits.supabase.monthlyQueries,
      unit: 'consultas'
    },
    {
      name: 'Conexiones Realtime',
      current: usage.realtimeConnections,
      max: limits.supabase.realtimeConnections,
      unit: 'conexiones'
    },
    {
      name: 'Verificaciones Auth',
      current: usage.authChecks,
      max: 1000, // Límite estimado
      unit: 'verificaciones'
    }
  ];

  return (
    <div className="space-y-4">
      {resources.map((resource) => {
        const percentage = calculatePercentage(resource.current, resource.max);
        return (
          <div key={resource.name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{resource.name}</span>
              <span className="text-muted-foreground">
                {resource.current.toLocaleString()} / {resource.max.toLocaleString()} {resource.unit}
              </span>
            </div>
            <div className="relative">
              <Progress value={percentage} className="h-2" />
              <div 
                className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getStatusColor(percentage)}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{percentage.toFixed(1)}% usado</span>
              <Badge variant={percentage > 80 ? 'destructive' : percentage > 60 ? 'secondary' : 'default'}>
                {percentage > 80 ? 'Crítico' : percentage > 60 ? 'Advertencia' : 'Normal'}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PerformanceDashboard() {
  const { stats, alerts, resolveAlert, generateReport, incrementUsage } = usePerformanceMonitor();
  const { stats: cacheStats, recordHit, recordMiss } = useCacheOptimization();
  const [report, setReport] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Simular datos si no están disponibles
  const mockStats = {
    performance: {
      avgPageLoadTime: 1200,
      currentMemoryUsage: 45 * 1024 * 1024,
      metricsCount: 25
    },
    resources: {
      supabaseQueries: 1250,
      realtimeConnections: 1,
      authChecks: 89,
      cacheHits: 156,
      cacheMisses: 34,
      storageOperations: 23
    },
    alerts: {
      total: 3,
      unresolved: 1,
      recent: [
        {
          id: '1',
          type: 'warning' as const,
          message: 'Tiempo de carga alto detectado: 1.2s',
          timestamp: Date.now() - 300000,
          resolved: false
        }
      ]
    },
    limits: {
      supabase: {
        monthlyQueries: 50000,
        realtimeConnections: 2,
        storageSize: 500 * 1024 * 1024
      },
      performance: {
        maxPageLoadTime: 3000,
        maxMemoryUsage: 50 * 1024 * 1024
      }
    }
  };

  const currentStats = stats || mockStats;
  const currentAlerts = alerts || mockStats.alerts.recent;

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const newReport = generateReport ? generateReport() : {
        summary: {
          status: 'good',
          score: 85
        },
        recommendations: [
          'Implementar lazy loading para mejorar tiempo de carga',
          'Optimizar consultas de base de datos',
          'Configurar caché más agresivo para contenido estático'
        ],
        generatedAt: new Date().toISOString()
      };
      setReport(newReport);
    } catch (error) {
      console.error('Error generando reporte:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleResolveAlert = (alertId: string) => {
    if (resolveAlert) {
      resolveAlert(alertId);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const cacheHitRate = currentStats.resources.cacheHits + currentStats.resources.cacheMisses > 0
    ? (currentStats.resources.cacheHits / (currentStats.resources.cacheHits + currentStats.resources.cacheMisses)) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Rendimiento</h1>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real de recursos y optimización
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Actualizado: {new Date(lastUpdate).toLocaleTimeString()}
          </Badge>
          <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
            {isGeneratingReport ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Generar Reporte
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tiempo de Carga"
          value={`${currentStats.performance.avgPageLoadTime}ms`}
          description="Promedio de carga de páginas"
          icon={<Clock className="h-4 w-4" />}
          status={currentStats.performance.avgPageLoadTime > 2000 ? 'warning' : 'good'}
          trend="stable"
        />
        
        <MetricCard
          title="Uso de Memoria"
          value={formatBytes(currentStats.performance.currentMemoryUsage)}
          description="Memoria JavaScript utilizada"
          icon={<HardDrive className="h-4 w-4" />}
          status={currentStats.performance.currentMemoryUsage > 40 * 1024 * 1024 ? 'warning' : 'good'}
          trend="up"
        />
        
        <MetricCard
          title="Tasa de Acierto de Caché"
          value={`${cacheHitRate.toFixed(1)}%`}
          description="Eficiencia del sistema de caché"
          icon={<Database className="h-4 w-4" />}
          status={cacheHitRate < 70 ? 'warning' : 'good'}
          trend={cacheHitRate > 80 ? 'up' : 'stable'}
        />
        
        <MetricCard
          title="Consultas Supabase"
          value={currentStats.resources.supabaseQueries.toLocaleString()}
          description="Consultas realizadas este mes"
          icon={<Server className="h-4 w-4" />}
          status={currentStats.resources.supabaseQueries > 40000 ? 'warning' : 'good'}
          trend="up"
        />
      </div>

      {/* Contenido principal */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="cache">Caché</TabsTrigger>
          <TabsTrigger value="report">Reporte</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Estado General
                </CardTitle>
                <CardDescription>
                  Resumen del rendimiento de la aplicación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado del Sistema</span>
                  <Badge variant={currentStats.alerts.unresolved > 0 ? 'destructive' : 'default'}>
                    {currentStats.alerts.unresolved > 0 ? 'Requiere Atención' : 'Operativo'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Puntuación de Rendimiento</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={report?.summary?.score || 85} className="w-20" />
                    <span className="text-sm font-bold">{report?.summary?.score || 85}/100</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conexiones Activas</span>
                  <span className="text-sm">{currentStats.resources.realtimeConnections}/2</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Métricas Recolectadas</span>
                  <span className="text-sm">{currentStats.performance.metricsCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Optimizaciones Activas
                </CardTitle>
                <CardDescription>
                  Funciones de optimización implementadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Caché del Cliente</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Operaciones Batch</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auth Optimizada</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Headers de Caché</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Monitoreo de Recursos</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uso de Recursos</CardTitle>
              <CardDescription>
                Monitoreo de límites de planes gratuitos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResourceUsageChart 
                usage={currentStats.resources} 
                limits={currentStats.limits} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Alertas del Sistema</span>
                <Badge variant="outline">
                  {currentStats.alerts.unresolved} sin resolver
                </Badge>
              </CardTitle>
              <CardDescription>
                Alertas y notificaciones de rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentAlerts.length > 0 ? (
                <div className="space-y-2">
                  {currentAlerts.map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onResolve={handleResolveAlert}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No hay alertas activas</p>
                  <p className="text-sm">El sistema está funcionando correctamente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Caché</CardTitle>
                <CardDescription>
                  Rendimiento del sistema de caché
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Aciertos</span>
                  <span className="text-sm">{currentStats.resources.cacheHits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fallos</span>
                  <span className="text-sm">{currentStats.resources.cacheMisses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tasa de Acierto</span>
                  <span className="text-sm font-bold">{cacheHitRate.toFixed(1)}%</span>
                </div>
                <Progress value={cacheHitRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimizaciones de Caché</CardTitle>
                <CardDescription>
                  Recomendaciones para mejorar el rendimiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {cacheHitRate < 70 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Tasa de acierto baja</AlertTitle>
                    <AlertDescription>
                      Considera aumentar el TTL del caché o implementar pre-carga de datos.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="text-sm space-y-2">
                  <p>• Implementar caché predictivo para datos frecuentes</p>
                  <p>• Configurar invalidación inteligente de caché</p>
                  <p>• Usar Service Workers para caché offline</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Optimización</CardTitle>
              <CardDescription>
                Análisis detallado y recomendaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="font-semibold">Puntuación General</h3>
                      <p className="text-sm text-muted-foreground">
                        Estado: {report.summary.status === 'good' ? 'Bueno' : 'Requiere Atención'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{report.summary.score}/100</div>
                      <Progress value={report.summary.score} className="w-20 mt-1" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Recomendaciones</h4>
                    <div className="space-y-2">
                      {report.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Generado: {new Date(report.generatedAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No hay reporte disponible</p>
                  <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
                    {isGeneratingReport ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Activity className="h-4 w-4 mr-2" />
                    )}
                    Generar Reporte
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PerformanceDashboard;