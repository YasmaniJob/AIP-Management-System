// src/components/molecules/stat-card.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/atoms/icon';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
  color
}) => {
  return (
    <Card className={cn('transition-all hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <Icon 
            icon={icon} 
            size="sm" 
            color={color}
            className="text-muted-foreground" 
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={color ? { color } : undefined}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={cn(
            'text-xs mt-1 flex items-center',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            <span className={trend.isPositive ? '↗' : '↘'}>
              {Math.abs(trend.value)}%
            </span>
            <span className="ml-1 text-muted-foreground">
              vs mes anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;