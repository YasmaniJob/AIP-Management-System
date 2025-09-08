// src/hooks/use-notifications.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { getUserNotifications, getNotificationStats, markAsRead, markAllAsRead, type Notification } from '@/lib/services/notification-service';

interface UseNotificationsOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  unreadOnly?: boolean;
  limit?: number;
}

interface NotificationStats {
  total: number;
  unread: number;
  critical: number;
  byType: Record<string, number>;
}

export function useNotifications({
  userId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 segundos
  unreadOnly = false,
  limit = 50
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    critical: 0,
    byType: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setError(null);
      const data = await getUserNotifications(userId, {
        unreadOnly,
        limit
      });
      setNotifications(data);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Error al cargar las notificaciones');
    }
  }, [userId, unreadOnly, limit]);

  const loadStats = useCallback(async () => {
    try {
      const data = await getNotificationStats(userId);
      setStats(data);
    } catch (err) {
      console.error('Error loading notification stats:', err);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadNotifications(), loadStats()]);
    setLoading(false);
  }, [loadNotifications, loadStats]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const success = await markAsRead(notificationId, userId);
      if (success) {
        // Actualizar el estado local inmediatamente
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        
        // Actualizar estadísticas
        setStats(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1)
        }));
        
        // Recargar datos para asegurar consistencia
        await loadStats();
      }
      return success;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Error al marcar la notificación como leída');
      return false;
    }
  }, [userId, loadStats]);

  const markAllAsRead = useCallback(async () => {
    try {
      const success = await markAllAsRead(userId);
      if (success) {
        // Actualizar el estado local inmediatamente
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        
        // Actualizar estadísticas
        setStats(prev => ({ ...prev, unread: 0 }));
        
        // Recargar datos para asegurar consistencia
        await refresh();
      }
      return success;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Error al marcar todas las notificaciones como leídas');
      return false;
    }
  }, [userId, refresh]);

  // Cargar datos iniciales
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadNotifications();
      loadStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadNotifications, loadStats]);

  // Limpiar error después de un tiempo
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  return {
    notifications,
    stats,
    loading,
    error,
    refresh,
    markAsRead,
    markAllAsRead
  };
}

// Hook simplificado para solo obtener estadísticas
export function useNotificationStats(userId: string, autoRefresh = true) {
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    critical: 0,
    byType: {}
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await getNotificationStats(userId);
      setStats(data);
    } catch (err) {
      console.error('Error loading notification stats:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadStats, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, [autoRefresh, loadStats]);

  return { stats, loading, refresh: loadStats };
}