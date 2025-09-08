'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { useMaintenanceReports } from '@/hooks/use-maintenance-reports';
import { FileText, TrendingUp, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function MaintenanceReportsView() {
  const {
    reports,
    loading,
    error,
    selectedReport,
    generating,
    refreshReports,
    generateReport,
    selectReport
  } = useMaintenanceReports();

  const [activeTab, setActiveTab] = useState('overview');

  const handleGenerateReport = async (type: 'monthly' | 'quarterly' | 'annual' | 'on_demand') => {
    await generateReport(type);
    await refreshReports();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={refreshReports}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reportes de Mantenimiento</h1>
          <p className="text-muted-foreground">
            Análisis automático y recomendaciones basadas en historial de incidencias
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleGenerateReport('monthly')}
            disabled={generating}
            variant="outline"
          >
            {generating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
            Reporte Mensual
          </Button>
          <Button
            onClick={() => handleGenerateReport('on_demand')}
            disabled={generating}
          >
            {generating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
            Generar Reporte
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {reports.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Incidencias</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reports[0]?.summary.total_incidents || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {reports[0]?.summary.resolved_incidents || 0} resueltas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recursos Afectados</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reports[0]?.summary.total_resources_affected || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Requieren atención
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reports[0]?.summary.avg_resolution_time || 0}h</div>
                  <p className="text-xs text-muted-foreground">
                    Resolución promedio
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Costo Estimado</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    S/. {reports[0]?.cost_analysis.estimated_maintenance_cost?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mantenimiento estimado
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay reportes disponibles</h3>
                <p className="text-muted-foreground mb-4">
                  Genera tu primer reporte de mantenimiento para comenzar el análisis
                </p>
                <Button onClick={() => handleGenerateReport('on_demand')} disabled={generating}>
                  {generating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                  Generar Reporte
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => selectReport(report)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <CardDescription>{report.description}</CardDescription>
                      </div>
                      <Badge variant={report.report_type === 'on_demand' ? 'default' : 'secondary'}>
                        {report.report_type === 'monthly' ? 'Mensual' :
                         report.report_type === 'quarterly' ? 'Trimestral' :
                         report.report_type === 'annual' ? 'Anual' : 'Bajo Demanda'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Período</p>
                        <p className="font-medium">
                          {format(new Date(report.period_start), 'dd/MM/yyyy', { locale: es })} -
                          {format(new Date(report.period_end), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Incidencias</p>
                        <p className="font-medium">{report.summary.total_incidents}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Recomendaciones</p>
                        <p className="font-medium">{report.recommendations.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Generado</p>
                        <p className="font-medium">
                          {format(new Date(report.generated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {selectedReport ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Recomendaciones - {selectedReport.title}</h3>
                <Button variant="outline" onClick={() => selectReport(null)}>
                  Ver Todos los Reportes
                </Button>
              </div>
              
              {selectedReport.recommendations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No hay recomendaciones para este reporte</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {selectedReport.recommendations.map((rec) => (
                    <Card key={rec.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{rec.title}</CardTitle>
                            <CardDescription>
                              {rec.resource.category.name} - {rec.resource.brand} {rec.resource.model} (#{rec.resource.number})
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={
                              rec.recommendation_type === 'preventive' ? 'default' :
                              rec.recommendation_type === 'corrective' ? 'destructive' :
                              rec.recommendation_type === 'replacement' ? 'secondary' : 'outline'
                            }>
                              {rec.recommendation_type === 'preventive' ? 'Preventivo' :
                               rec.recommendation_type === 'corrective' ? 'Correctivo' :
                               rec.recommendation_type === 'replacement' ? 'Reemplazo' : 'Inspección'}
                            </Badge>
                            <Badge variant={
                              rec.status === 'pending' ? 'outline' :
                              rec.status === 'in_progress' ? 'default' :
                              rec.status === 'completed' ? 'secondary' : 'destructive'
                            }>
                              {rec.status === 'pending' ? 'Pendiente' :
                               rec.status === 'in_progress' ? 'En Progreso' :
                               rec.status === 'completed' ? 'Completado' : 'Cancelado'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{rec.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {rec.estimated_cost && (
                            <div>
                              <p className="text-muted-foreground">Costo Estimado</p>
                              <p className="font-medium">S/. {rec.estimated_cost.toFixed(2)}</p>
                            </div>
                          )}
                          {rec.estimated_duration && (
                            <div>
                              <p className="text-muted-foreground">Duración Estimada</p>
                              <p className="font-medium">{rec.estimated_duration}h</p>
                            </div>
                          )}
                          {rec.due_date && (
                            <div>
                              <p className="text-muted-foreground">Fecha Límite</p>
                              <p className="font-medium">
                                {format(new Date(rec.due_date), 'dd/MM/yyyy', { locale: es })}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecciona un reporte</h3>
                <p className="text-muted-foreground">
                  Ve a la pestaña "Reportes" y selecciona un reporte para ver sus recomendaciones
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}