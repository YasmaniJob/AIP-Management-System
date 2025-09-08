'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSystemSettings } from '@/lib/actions/settings';
import type { Database } from '@/lib/supabase/database.types';

type SystemSettings = Database['public']['Tables']['system_settings']['Row'];

interface ConfigContextType {
  settings: SystemSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      setLoading(true);
      const data = await getSystemSettings();
      setSettings(data);
    } catch (error) {
      console.warn('Warning: Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  // Helper function to convert hex to HSL
  const hexToHsl = (hex: string): string => {
    // Remove the hash if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  // Apply CSS variables for theming
  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      // Apply primary color
      if (settings.primary_color) {
        const hslPrimary = hexToHsl(settings.primary_color);
        root.style.setProperty('--primary', hslPrimary);
      }
      
      // Apply accent color
      if (settings.accent_color) {
        const hslAccent = hexToHsl(settings.accent_color);
        root.style.setProperty('--accent', hslAccent);
      }
    }
  }, [settings]);

  return (
    <ConfigContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

// Hook to get app name with fallback
export function useAppName() {
  const { settings } = useConfig();
  return settings?.app_name || 'AIP Manager';
}

// Hook to get app logo with fallback
export function useAppLogo() {
  const { settings } = useConfig();
  return settings?.app_logo_url;
}

// Hook to get theme colors
export function useThemeColors() {
  const { settings } = useConfig();
  return {
    primary: settings?.primary_color || '#10b981',
    accent: settings?.accent_color || '#3b82f6',
    preset: settings?.theme_preset || 'default'
  };
}