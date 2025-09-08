// src/lib/config/app-config.ts
import { z } from 'zod';
import { nodeEnvironmentSchema } from '../constants/shared-schemas';

// Environment validation schema
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: nodeEnvironmentSchema.default('development'),
});

// Validate environment variables
const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});

// Application configuration
export const appConfig = {
  // Environment
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  
  // URLs
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  app: {
    name: 'Sistema de Gestión Escolar',
    description: 'Sistema integral para la gestión de recursos educativos',
    url: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    version: '1.0.0',
  },
  
  // UI Configuration
  ui: {
    // Pagination
    pagination: {
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20, 50],
      maxPageSize: 100,
    },
    
    // Tables
    table: {
      defaultEmptyMessage: 'No hay datos disponibles',
      defaultSearchPlaceholder: 'Buscar...',
    },
    
    // Forms
    form: {
      defaultSubmitText: 'Guardar',
      defaultCancelText: 'Cancelar',
      defaultLoadingText: 'Guardando...',
    },
    
    // Toasts
    toast: {
      duration: 5000,
      defaultSuccessTitle: 'Éxito',
      defaultErrorTitle: 'Error',
      defaultWarningTitle: 'Advertencia',
      defaultInfoTitle: 'Información',
    },
    
    // Dialogs
    dialog: {
      defaultConfirmText: 'Confirmar',
      defaultCancelText: 'Cancelar',
      defaultDeleteTitle: 'Confirmar eliminación',
      defaultDeleteMessage: '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.',
    },
  },
  
  // Business Rules
  business: {
    // Loans
    loans: {
      maxDurationDays: 30,
      maxRenewals: 2,
      reminderDaysBefore: 3,
    },
    
    // Bookings
    bookings: {
      maxAdvanceBookingDays: 90,
      minBookingDurationMinutes: 30,
      maxBookingDurationHours: 8,
    },
    
    // Resources
    resources: {
      lowStockThreshold: 5,
      criticalStockThreshold: 2,
    },
    
    // Users
    users: {
      passwordMinLength: 8,
    },
  },
  
  // Features flags
  features: {
    enableNotifications: true,
    enableBulkOperations: true,
    enableAdvancedSearch: true,
    enableExport: true,

  },
  
  // Performance
  performance: {
    // Cache durations (in seconds)
    cache: {
      staticData: 3600, // 1 hour
      userData: 300,    // 5 minutes
    },
    
    // Request limits
    limits: {
      maxConcurrentRequests: 10,
      requestTimeoutMs: 30000,
      retryAttempts: 3,
    },
  },
  
  // Security
  security: {
    sessionTimeoutMinutes: 480, // 8 hours
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
  },
} as const;

// Type for the configuration
export type AppConfig = typeof appConfig;

// Helper functions
export const getConfig = () => appConfig;

export const isFeatureEnabled = (feature: keyof typeof appConfig.features): boolean => {
  return appConfig.features[feature];
};

export const getBusinessRule = <T extends keyof typeof appConfig.business>(
  category: T
): typeof appConfig.business[T] => {
  return appConfig.business[category];
};

export const getUIConfig = <T extends keyof typeof appConfig.ui>(
  category: T
): typeof appConfig.ui[T] => {
  return appConfig.ui[category];
};

export default appConfig;