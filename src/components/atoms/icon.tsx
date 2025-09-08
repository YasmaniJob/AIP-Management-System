// src/components/atoms/icon.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconProps {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  color?: string;
  className?: string;
  'aria-label'?: string;
}

const sizeMap = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
  '2xl': 'h-10 w-10',
};

// Predefined color variants for consistency
const colorVariants = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-muted-foreground',
  destructive: 'text-destructive',
  success: 'text-green-600',
  warning: 'text-amber-500',
  info: 'text-blue-600',
};

export const Icon: React.FC<IconProps> = ({ 
  icon: IconComponent, 
  size = 'md', 
  color, 
  className,
  'aria-label': ariaLabel,
  ...props
}) => {
  // Check if color is a predefined variant
  const colorClass = color && colorVariants[color as keyof typeof colorVariants] 
    ? colorVariants[color as keyof typeof colorVariants]
    : undefined;

  return (
    <IconComponent 
      className={cn(
        sizeMap[size], 
        colorClass,
        className
      )}
      style={color && !colorClass ? { color } : undefined}
      aria-label={ariaLabel}
      {...props}
    />
  );
};

export default Icon;
export { colorVariants, sizeMap };