// src/components/atoms/status-badge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  text: string;
  icon?: LucideIcon;
  className?: string;
  customColor?: string;
}

const statusStyles = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  neutral: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  text, 
  icon: Icon, 
  className,
  customColor
}) => {
  const style = customColor ? {
    backgroundColor: customColor + '20',
    color: customColor,
    borderColor: customColor + '40'
  } : undefined;

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        'border',
        !customColor && statusStyles[status],
        className
      )}
      style={style}
    >
      {Icon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
      {text}
    </Badge>
  );
};

export default StatusBadge;