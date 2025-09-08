// src/components/ui/unified-filter-tabs.tsx
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { type CategoryColorName, categoryColorService } from '@/lib/services/category-color-service';
import { useState, useEffect } from 'react';

export interface FilterTab {
  value: string;
  label: string;
  color?: CategoryColorName;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface UnifiedFilterTabsProps {
  tabs: FilterTab[];
  defaultTab?: string;
  paramName?: string;
  className?: string;
  onTabChange?: (value: string) => void;
  value?: string; // Valor controlado
}

const getTabColorClasses = (color: string, isActive: boolean) => {
  const colorMap = {
    blue: isActive 
      ? 'bg-blue-500 text-white border-blue-500 shadow-sm' 
      : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200',
    green: isActive 
      ? 'bg-green-500 text-white border-green-500 shadow-sm' 
      : 'text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200',
    orange: isActive 
      ? 'bg-orange-500 text-white border-orange-500 shadow-sm' 
      : 'text-orange-600 hover:bg-orange-50 hover:text-orange-700 border-orange-200',
    purple: isActive 
      ? 'bg-purple-500 text-white border-purple-500 shadow-sm' 
      : 'text-purple-600 hover:bg-purple-50 hover:text-purple-700 border-purple-200',
    red: isActive 
      ? 'bg-red-500 text-white border-red-500 shadow-sm' 
      : 'text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200',
    yellow: isActive 
      ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm' 
      : 'text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 border-yellow-200',
    gray: isActive 
      ? 'bg-gray-500 text-white border-gray-500 shadow-sm' 
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700 border-gray-200',
    teal: isActive 
      ? 'bg-teal-500 text-white border-teal-500 shadow-sm' 
      : 'text-teal-600 hover:bg-teal-50 hover:text-teal-700 border-teal-200',
    fuchsia: isActive 
      ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-sm' 
      : 'text-fuchsia-600 hover:bg-fuchsia-50 hover:text-fuchsia-700 border-fuchsia-200',
    indigo: isActive 
      ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' 
      : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 border-indigo-200',
    pink: isActive 
      ? 'bg-pink-500 text-white border-pink-500 shadow-sm' 
      : 'text-pink-600 hover:bg-pink-50 hover:text-pink-700 border-pink-200',
    rose: isActive 
      ? 'bg-rose-500 text-white border-rose-500 shadow-sm' 
      : 'text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200',
    violet: isActive 
      ? 'bg-violet-500 text-white border-violet-500 shadow-sm' 
      : 'text-violet-600 hover:bg-violet-50 hover:text-violet-700 border-violet-200'
  };
  
  return colorMap[color as keyof typeof colorMap] || colorMap.gray;
};

export function UnifiedFilterTabs({ 
  tabs, 
  defaultTab, 
  paramName = 'tab',
  className,
  onTabChange,
  value 
}: UnifiedFilterTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Evitar inconsistencias de hidratación
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Si se proporciona onTabChange, usar modo controlado
  const currentTab = onTabChange && value !== undefined 
    ? value 
    : isHydrated 
      ? searchParams.get(paramName) || defaultTab || tabs[0]?.value
      : defaultTab || tabs[0]?.value;

  // Evitar renderizado hasta que esté hidratado para prevenir inconsistencias
  if (!isHydrated && !onTabChange) {
    return null;
  }

  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set(paramName, value);
      router.push(`${pathname}?${params.toString()}`);
    }
  };
  
  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className={className}>
      <TabsList className="grid w-full bg-gray-100 p-1 rounded-lg" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.value;
          const colorClasses = getTabColorClasses(tab.color || 'gray', isActive);
          
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'gap-2 relative border rounded-md data-[state=active]:shadow-sm',
                colorClasses
              )}
            >
              {tab.icon && <tab.icon className="h-4 w-4" />}
              <span className="text-sm">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                )}>
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

// Hook para facilitar el uso del componente
export function useFilterTabs(paramName: string = 'tab', defaultTab?: string) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get(paramName) || defaultTab;
  
  return {
    currentTab,
    isTab: (value: string) => currentTab === value
  };
}