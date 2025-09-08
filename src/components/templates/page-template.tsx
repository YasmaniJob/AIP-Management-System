// src/components/templates/page-template.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface PageTemplateProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageAction[];
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showSeparator?: boolean;
}

export const PageTemplate: React.FC<PageTemplateProps> = ({
  title,
  description,
  breadcrumbs = [],
  actions = [],
  children,
  className,
  headerClassName,
  contentClassName,
  showSeparator = true
}) => {
  return (
    <div className={cn('flex flex-col space-y-6', className)}>
      {/* Header */}
      <div className={cn('space-y-4', headerClassName)}>
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink href={item.href}>
                        {item.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && (
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Title and Actions */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          
          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex items-center space-x-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="flex items-center space-x-2"
                >
                  {action.icon && <action.icon className="h-4 w-4" />}
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {showSeparator && <Separator />}
      </div>

      {/* Content */}
      <div className={cn('flex-1', contentClassName)}>
        {children}
      </div>
    </div>
  );
};

export default PageTemplate;