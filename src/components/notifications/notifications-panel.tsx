// src/components/notifications/notifications-panel.tsx
'use client';
import { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, AlertTriangle, Info, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getUserNotifications, getNotificationStats, markAsRead, markAllAsRead, type Notification } from '@/lib/services/notification-service';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationsPanelProps {
  userId: string;
  className?: string;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};

const typeIcons = {

};

const typeLabels = {

};

export function NotificationsPanel({ userId, className }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, critical: 0, byType: {} });
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadStats();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      loadNotifications();
      loadStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId, showUnreadOnly]);

  const loadNotifications = async () => {
    try {
      const data = await getUserNotifications(userId, {
        unreadOnly: showUnreadOnly,
        limit: 50
      });
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getNotificationStats(userId);
      setStats(data);
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId, userId);
      await loadNotifications();
      await loadStats();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(userId);
      await loadNotifications();
      await loadStats();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es
      });
    } catch {
      return 'Hace un momento';
    }
  };

  const renderNotificationIcon = (notification: Notification) => {
    const IconComponent = typeIcons[notification.type] || Info;
    const colorClass = notification.priority === 'critical' ? 'text-red-500' :
                      notification.priority === 'high' ? 'text-orange-500' :
                      notification.priority === 'medium' ? 'text-yellow-500' :
                      'text-blue-500';
    
    return <IconComponent className={`h-5 w-5 ${colorClass}`} />;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
            {stats.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unread}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={showUnreadOnly ? 'bg-primary text-primary-foreground' : ''}
            >
              {showUnreadOnly ? 'Todas' : 'No leídas'}
            </Button>
            {stats.unread > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>
        
        {/* Estadísticas rápidas */}
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            Total: {stats.total}
          </Badge>
          {stats.unread > 0 && (
            <Badge variant="secondary" className="text-xs">
              No leídas: {stats.unread}
            </Badge>
          )}
          {stats.critical > 0 && (
            <Badge variant="destructive" className="text-xs">
              Críticas: {stats.critical}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">
                {showUnreadOnly ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {renderNotificationIcon(notification)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-xs mt-1 ${
                              !notification.read ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {notification.message}
                            </p>
                            
                            {/* Información adicional */}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${priorityColors[notification.priority]}`}
                              >
                                {typeLabels[notification.type]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              {notification.persistent && (
                                <Badge variant="secondary" className="text-xs">
                                  Persistente
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="flex-shrink-0 h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Componente compacto para la barra de navegación
export function NotificationsBell({ userId, className }: NotificationsPanelProps) {
  const [stats, setStats] = useState({ unread: 0, critical: 0 });
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getNotificationStats(userId);
        setStats({ unread: data.unread, critical: data.critical });
      } catch (error) {
        console.error('Error loading notification stats:', error);
      }
    };

    loadStats();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPanel(!showPanel)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {stats.unread > 0 && (
          <Badge 
            variant={stats.critical > 0 ? "destructive" : "secondary"}
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {stats.unread > 99 ? '99+' : stats.unread}
          </Badge>
        )}
      </Button>
      
      {showPanel && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <NotificationsPanel 
            userId={userId} 
            className="w-96 shadow-lg border"
          />
        </div>
      )}
    </div>
  );
}