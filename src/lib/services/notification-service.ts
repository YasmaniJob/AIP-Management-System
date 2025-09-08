// src/lib/services/notification-service.ts
'use server';
import { dataService } from './data-service';
import type { Incident } from '../data/incidents';

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    incidentTypes?: string[];
    statuses?: string[];
    timeThresholds?: {
      unresolved?: number; // minutos
      overdue?: number; // días
    };
    resourceCategories?: string[];
  };
  actions: {
    email?: {
      recipients: string[];
      template: string;
    };
    inApp?: {
      priority: 'low' | 'medium' | 'high' | 'critical';
      persistent: boolean;
    };
    webhook?: {
      url: string;
      method: 'POST' | 'PUT';
    };
  };
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: 'incident_created' | 'incident_overdue' | 'incident_critical' | 'incident_resolved';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipient_id: string;
  incident_id?: string;
  resource_id?: string;
  read: boolean;
  persistent: boolean;
  created_at: string;
  expires_at?: string;
  metadata?: any;
}

// Variables globales para mantener el estado
let rules: NotificationRule[] = [];
let initialized = false;

async function initialize() {
  if (initialized) return;
  
  try {
    // Cargar reglas de notificación desde la base de datos
    const loadedRules = await dataService.findMany('notification_rules', {
      filters: { enabled: true },
      orderBy: { created_at: 'desc' }
    });
    
    rules = loadedRules || [];
    initialized = true;
  } catch (error) {
    console.error('Error initializing notification service:', error);
    // Usar reglas por defecto si no se pueden cargar desde la BD
    rules = getDefaultRules();
    initialized = true;
  }
}

function getDefaultRules(): NotificationRule[] {
    return [
      {
        id: 'critical-incidents',
        name: 'Incidencias Críticas',
        description: 'Notificar inmediatamente cuando se reportan incidencias críticas',
        conditions: {
          incidentTypes: ['Daño', 'Hardware'],
          statuses: ['Reportado']
        },
        actions: {
          inApp: {
            priority: 'critical',
            persistent: true
          }
        },
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'overdue-incidents',
        name: 'Incidencias Vencidas',
        description: 'Notificar cuando las incidencias no se resuelven en tiempo',
        conditions: {
          statuses: ['Reportado', 'En Revisión'],
          timeThresholds: {
            overdue: 3 // 3 días
          }
        },
        actions: {
          inApp: {
            priority: 'high',
            persistent: true
          }
        },
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'unattended-incidents',
        name: 'Incidencias Sin Atender',
        description: 'Notificar cuando las incidencias reportadas no se revisan',
        conditions: {
          statuses: ['Reportado'],
          timeThresholds: {
            unresolved: 60 // 1 hora
          }
        },
        actions: {
          inApp: {
            priority: 'medium',
            persistent: false
          }
        },
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

export async function processIncidentNotifications(incident: Incident, eventType: 'created' | 'updated' | 'resolved') {
  await initialize();
  
  const notifications: Omit<Notification, 'id' | 'created_at'>[] = [];
  
  for (const rule of rules) {
    if (!rule.enabled) continue;
    
    const shouldNotify = await evaluateRule(rule, incident, eventType);
    
    if (shouldNotify) {
      const notification = await createNotificationFromRule(rule, incident, eventType);
      if (notification) {
        notifications.push(notification);
      }
    }
  }
  
  // Enviar notificaciones
  for (const notification of notifications) {
    await sendNotification(notification);
  }
  
  return notifications;
}

async function evaluateRule(rule: NotificationRule, incident: Incident, eventType: string): Promise<boolean> {
  const { conditions } = rule;
  
  // Verificar tipos de incidencia
  if (conditions.incidentTypes && !conditions.incidentTypes.includes(incident.type)) {
    return false;
  }
  
  // Verificar estados
  if (conditions.statuses && !conditions.statuses.includes(incident.status)) {
    return false;
  }
  
  // Verificar umbrales de tiempo
  if (conditions.timeThresholds) {
    const now = new Date();
    const createdAt = new Date(incident.created_at);
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    const diffDays = diffMinutes / (60 * 24);
    
    if (conditions.timeThresholds.unresolved && diffMinutes < conditions.timeThresholds.unresolved) {
      return false;
    }
    
    if (conditions.timeThresholds.overdue && diffDays < conditions.timeThresholds.overdue) {
      return false;
    }
  }
  
  // Verificar categorías de recursos
  if (conditions.resourceCategories && incident.resource?.category?.name) {
    if (!conditions.resourceCategories.includes(incident.resource.category.name)) {
      return false;
    }
  }
  
  return true;
}

async function createNotificationFromRule(
  rule: NotificationRule, 
  incident: Incident, 
  eventType: string
): Promise<Omit<Notification, 'id' | 'created_at'> | null> {
  const { actions } = rule;
  
  if (!actions.inApp) return null;
  
  let title = '';
  let message = '';
  let type: Notification['type'] = 'incident_created';
  
  switch (eventType) {
    case 'created':
      type = 'incident_created';
      if (incident.type === 'Daño' || incident.type === 'Hardware') {
        type = 'incident_critical';
        title = '🚨 Incidencia Crítica Reportada';
        message = `Se ha reportado una incidencia crítica: ${incident.title} en ${incident.resource?.category?.name} ${incident.resource?.number}`;
      } else {
        title = '📋 Nueva Incidencia Reportada';
        message = `Nueva incidencia: ${incident.title} en ${incident.resource?.category?.name} ${incident.resource?.number}`;
      }
      break;
      
    case 'updated':
      const now = new Date();
      const createdAt = new Date(incident.created_at);
      const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays >= 3 && incident.status !== 'Resuelto') {
        type = 'incident_overdue';
        title = '⏰ Incidencia Vencida';
        message = `La incidencia "${incident.title}" lleva ${Math.floor(diffDays)} días sin resolver`;
      }
      break;
      
    case 'resolved':
      type = 'incident_resolved';
      title = '✅ Incidencia Resuelta';
      message = `Se ha resuelto la incidencia: ${incident.title}`;
      break;
  }
  
  if (!title || !message) return null;
  
  // Determinar destinatarios (por ahora, administradores y técnicos)
  const recipients = await getNotificationRecipients(incident, rule);
  
  const notifications = recipients.map(recipientId => ({
    type,
    title,
    message,
    priority: actions.inApp.priority,
    recipient_id: recipientId,
    incident_id: incident.id,
    resource_id: incident.resource_id,
    read: false,
    persistent: actions.inApp.persistent,
    expires_at: actions.inApp.persistent ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
    metadata: {
      rule_id: rule.id,
      incident_type: incident.type,
      incident_status: incident.status
    }
  }));
  
  return notifications[0]; // Por simplicidad, devolver solo la primera
}

async function getNotificationRecipients(incident: Incident, rule: NotificationRule): Promise<string[]> {
  try {
    // Obtener usuarios con roles de administrador o técnico
    const users = await dataService.findMany('users', {
      select: 'id',
      filters: {
        role: ['admin', 'tecnico']
      }
    });
    
    return users.map((user: any) => user.id);
  } catch (error) {
    console.error('Error getting notification recipients:', error);
    return [];
  }
}

async function sendNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
  try {
    await dataService.create('notifications', notification);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Obtener notificaciones para un usuario
export async function getUserNotifications(
  userId: string, 
  options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Notification[]> {
  const filters: any = { recipient_id: userId };
  
  if (options.unreadOnly) {
    filters.read = false;
  }
  
  // Filtrar notificaciones no expiradas
  const now = new Date().toISOString();
  
  try {
    // Obtener notificaciones sin joins automáticos para evitar errores de relación
    const notifications = await dataService.findMany('notifications', {
      select: '*',
      filters,
      orderBy: { created_at: 'desc' },
      limit: options.limit || 50,
      offset: options.offset || 0
    });
    
    // Enriquecer con datos de incidents y resources manualmente si es necesario
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification: any) => {
        let incident = null;
        let resource = null;
        
        if (notification.incident_id) {
          try {
            const incidentData = await dataService.findById('incidents', notification.incident_id, {
              select: 'id, title, status, type, resource_id'
            });
            incident = incidentData;
            
            if (incidentData?.resource_id) {
              const resourceData = await dataService.findById('resources', incidentData.resource_id, {
                select: 'id, number, brand, model, category_id'
              });
              resource = resourceData;
            }
          } catch (err) {
            console.warn('Error enriching notification with incident data:', err);
          }
        }
        
        return {
          ...notification,
          incident,
          resource
        };
      })
    );
    
    // Filtrar notificaciones expiradas en el cliente
    return enrichedNotifications.filter((notification: any) => 
      !notification.expires_at || notification.expires_at > now
    );
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

// Marcar notificación como leída
export async function markAsRead(notificationId: string, userId: string): Promise<boolean> {
  try {
    await dataService.update('notifications', notificationId, {
      read: true
    }, {
      filters: { recipient_id: userId }
    });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

// Marcar todas las notificaciones como leídas
export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    await dataService.updateMany('notifications', {
      read: true
    }, {
      recipient_id: userId,
      read: false
    });
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

// Eliminar notificaciones expiradas
export async function cleanupExpiredNotifications(): Promise<void> {
  try {
    const now = new Date().toISOString();
    await dataService.deleteMany('notifications', {
      expires_at: { lt: now },
      persistent: false
    });
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
  }
}

// Obtener estadísticas de notificaciones
export async function getNotificationStats(userId: string): Promise<{
  total: number;
  unread: number;
  critical: number;
  byType: Record<string, number>;
}> {
  try {
    const notifications = await getUserNotifications(userId);
    
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const critical = notifications.filter(n => n.priority === 'critical').length;
    
    const byType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, unread, critical, byType };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return { total: 0, unread: 0, critical: 0, byType: {} };
  }
}

// Verificar incidencias vencidas (para ejecutar periódicamente)
export async function checkOverdueIncidents(): Promise<void> {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    
    const overdueIncidents = await dataService.findMany('incidents', {
      select: `
        *,
        resource:resources (id, number, brand, model, category:categories(name)),
        reporter:users!incidents_reported_by_fkey (name, email)
      `,
      filters: {
        status: ['Reportado', 'En Revisión'],
        created_at: { lt: threeDaysAgo }
      }
    });
    
    for (const incident of overdueIncidents) {
      await processIncidentNotifications(incident, 'updated');
    }
  } catch (error) {
    console.error('Error checking overdue incidents:', error);
  }
}