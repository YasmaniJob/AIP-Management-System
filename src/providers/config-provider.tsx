// src/providers/config-provider.tsx
'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import { appConfig, type AppConfig } from '@/lib/config/app-config';

interface ConfigContextType {
  config: AppConfig;
  isFeatureEnabled: (feature: keyof AppConfig['features']) => boolean;
  getBusinessRule: <T extends keyof AppConfig['business']>(category: T) => AppConfig['business'][T];
  getUIConfig: <T extends keyof AppConfig['ui']>(category: T) => AppConfig['ui'][T];
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const isFeatureEnabled = (feature: keyof AppConfig['features']): boolean => {
    return appConfig.features[feature];
  };

  const getBusinessRule = <T extends keyof AppConfig['business']>(
    category: T
  ): AppConfig['business'][T] => {
    return appConfig.business[category];
  };

  const getUIConfig = <T extends keyof AppConfig['ui']>(
    category: T
  ): AppConfig['ui'][T] => {
    return appConfig.ui[category];
  };

  const value: ConfigContextType = {
    config: appConfig,
    isFeatureEnabled,
    getBusinessRule,
    getUIConfig,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

// Convenience hooks for specific config sections
export const useFeatures = () => {
  const { config, isFeatureEnabled } = useConfig();
  return {
    features: config.features,
    isEnabled: isFeatureEnabled,
  };
};

export const useBusinessRules = () => {
  const { getBusinessRule } = useConfig();
  return { getRule: getBusinessRule };
};

export const useUIConfig = () => {
  const { getUIConfig } = useConfig();
  return { getConfig: getUIConfig };
};

export default ConfigProvider;