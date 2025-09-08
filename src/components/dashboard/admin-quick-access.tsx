'use client';

import { 
  ArrowRightLeft, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Package, 
  Settings, 
  BarChart3, 
  Plus,
  Eye,
  Zap,
  Activity,
  CheckCircle,
  XCircle,
  Timer,
  BookOpen,
  UserPlus,
  CalendarPlus,
  CalendarCheck
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface QuickStats {
  totalResources: number;
  activeLoans: number;
  overdueLoans: number;
  maintenanceItems: number;
  pendingReturns: number;
  availableResources: number;
}

interface NotificationStats {
  unreadCount: number;
  criticalCount: number;
}

export default function AdminQuickAccess() {
  const [stats, setStats] = useState<QuickStats>({
    totalResources: 0,
    activeLoans: 0,
    overdueLoans: 0,
    maintenanceItems: 0,
    pendingReturns: 0,
    availableResources: 0
  });
  
  const [notifications, setNotifications] = useState<NotificationStats>({
    unreadCount: 0,
    criticalCount: 0
  });
  
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtener estadísticas de recursos
        const { data: resources } = await supabase
          .from('resources')
          .select('id, status');
        
        // Obtener estadísticas de préstamos
        const { data: loans } = await supabase
          .from('loans')
          .select('id, status, expected_return_date')
          .in('status', ['active', 'overdue']);
        
        // Obtener estadísticas de mantenimiento
        const { data: maintenance } = await supabase
          .from('maintenance_records')
          .select('id, status')
          .eq('status', 'pending');
        
        // Calcular estadísticas
        const totalResources = resources?.length || 0;
        const activeLoans = loans?.filter(loan => loan.status === 'active').length || 0;
        const overdueLoans = loans?.filter(loan => loan.status === 'overdue').length || 0;
        const maintenanceItems = maintenance?.length || 0;
        const availableResources = resources?.filter(r => r.status === 'available').length || 0;
        const pendingReturns = activeLoans; // Los préstamos activos son retornos pendientes
        
        setStats({
          totalResources,
          activeLoans,
          overdueLoans,
          maintenanceItems,
          pendingReturns,
          availableResources
        });
        
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const { data: notificationData } = await supabase
          .from('notifications')
          .select('id, read, priority')
          .eq('read', false);
        
        const unreadCount = notificationData?.length || 0;
        const criticalCount = notificationData?.filter(n => n.priority === 'high').length || 0;
        
        setNotifications({ unreadCount, criticalCount });
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchStats();
    fetchNotifications();
  }, [supabase]);

  // Acciones principales rediseñadas - 4 acciones clave
  const primaryActions = [
    {
      title: "Préstamos",
      description: "Gestionar préstamos activos",
      icon: ArrowRightLeft,
      href: "/prestamos",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      stats: {
        main: stats.activeLoans,
        secondary: stats.overdueLoans,
        label: "Activos",
        secondaryLabel: "Vencidos"
      },
      urgent: stats.overdueLoans > 0
    },
    {
      title: "Inventario",
      description: "Recursos y equipamiento",
      icon: Package,
      href: "/inventario",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      stats: {
        main: stats.availableResources,
        secondary: stats.totalResources,
        label: "Disponibles",
        secondaryLabel: "Total"
      }
    },
    {
      title: "Reservas",
      description: "Programar recursos",
      icon: CalendarCheck,
      href: "/reservas",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      stats: {
        main: 0, // Se puede agregar lógica para reservas
        secondary: 0,
        label: "Activas",
        secondaryLabel: "Pendientes"
      }
    },
    {
      title: "Reuniones",
      description: "Agendar y gestionar",
      icon: Calendar,
      href: "/reuniones",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      stats: {
        main: 0, // Se puede agregar lógica para reuniones
        secondary: 0,
        label: "Hoy",
        secondaryLabel: "Programadas"
      }
    }
  ];

  const secondaryActions = [
    {
      title: "Añadir Docente",
      description: "Registrar nuevo docente",
      icon: UserPlus,
      href: "/docentes",
      color: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
    },
    {
      title: "Nueva Reserva",
      description: "Programar reserva de recurso",
      icon: CalendarPlus,
      href: "/reservas",
      color: "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
    },
    {
      title: "Programar Reunión",
      description: "Agendar nueva reunión",
      icon: BookOpen,
      href: "/reuniones",
      color: "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
    }
  ];

  const quickLinks = [
    {
      title: "Préstamos Activos",
      icon: Activity,
      href: "/prestamos?status=active",
      count: stats.activeLoans,
      color: "text-blue-600"
    },
    {
      title: "Préstamos Vencidos",
      icon: XCircle,
      href: "/prestamos?status=overdue",
      count: stats.overdueLoans,
      urgent: stats.overdueLoans > 0,
      color: "text-red-600"
    },
    {
      title: "Mantenimientos Pendientes",
      icon: Timer,
      href: "/inventario?status=maintenance",
      count: stats.maintenanceItems,
      urgent: stats.maintenanceItems > 5,
      color: "text-orange-600"
    },
    {
      title: "Recursos Disponibles",
      icon: CheckCircle,
      href: "/inventario?status=available",
      count: stats.availableResources,
      color: "text-green-600"
    },
    {
      title: "Gestión de Docentes",
      icon: Users,
      href: "/docentes",
      count: null,
      color: "text-purple-600"
    },
    {
      title: "Configuración del Sistema",
      icon: Settings,
      href: "/configuracion",
      count: null,
      color: "text-gray-600"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-4">
      {/* Header con estadísticas compactas */}
      <div className="flex-shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Recursos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalResources}</p>
              </div>
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-green-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableResources}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          <div className={`bg-white rounded-lg p-4 border shadow-sm ${
            stats.overdueLoans > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Vencidos</p>
                <p className={`text-2xl font-bold ${
                  stats.overdueLoans > 0 ? 'text-red-600' : 'text-gray-400'
                }`}>{stats.overdueLoans}</p>
              </div>
              <AlertTriangle className={`h-6 w-6 ${
                stats.overdueLoans > 0 ? 'text-red-600' : 'text-gray-400'
              }`} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-orange-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Mantenimiento</p>
                <p className="text-2xl font-bold text-orange-600">{stats.maintenanceItems}</p>
              </div>
              <Settings className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Principales - Grid 2x2 */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {primaryActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Link key={index} href={action.href}>
              <div className={`relative group cursor-pointer min-h-[220px] max-h-[240px] transform hover:scale-[1.02] transition-all duration-300 ${
                action.urgent ? 'animate-pulse' : ''
              }`}>
                <div className={`${action.color} rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all h-full flex flex-col justify-between`}>
                  {action.urgent && (
                    <div className="absolute -top-2 -right-2">
                      <Badge variant="destructive" className="animate-bounce text-xs">
                        ¡Urgente!
                      </Badge>
                    </div>
                  )}
                  
                  {/* Header del card */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <IconComponent className="h-8 w-8 mb-3" />
                      <h2 className="font-bold text-xl mb-1">{action.title}</h2>
                      <p className="text-xs opacity-90">{action.description}</p>
                    </div>
                    <div className="opacity-20">
                      <IconComponent className="h-12 w-12" />
                    </div>
                  </div>
                  
                  {/* Estadísticas */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{action.stats.main}</p>
                        <p className="text-xs opacity-75">{action.stats.label}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold opacity-80">{action.stats.secondary}</p>
                        <p className="text-xs opacity-75">{action.stats.secondaryLabel}</p>
                      </div>
                    </div>
                    
                    {/* Botón de acción */}
                    <div className="bg-white bg-opacity-20 rounded-lg p-2 flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                      <span className="font-medium text-sm">Acceder</span>
                      <ArrowRightLeft className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Acciones rápidas en la parte inferior */}
       <div className="grid grid-cols-2 gap-3">
        <Link href="/docentes">
          <Button variant="outline" className="w-full h-12 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 border-slate-300">
            <Users className="h-4 w-4 mr-2" />
            Docentes
          </Button>
        </Link>
        
        <Link href="/configuracion">
          <Button variant="outline" className="w-full h-12 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 border-slate-300">
            <Eye className="h-4 w-4 mr-2" />
            Configuración
          </Button>
        </Link>
      </div>
    </div>
  );
}