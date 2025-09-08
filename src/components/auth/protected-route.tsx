'use client';

import React, { ReactNode } from 'react';
import { useOptimizedAuth } from '@/hooks/use-optimized-auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'admin';
  fallback?: ReactNode;
}

function hasAdminPermissions(user: any): boolean {
  return user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';
}

export function ProtectedRoute({ 
  children, 
  requiredRole = 'user', 
  fallback 
}: ProtectedRouteProps) {
  const { user, loading } = useOptimizedAuth();
  
  const defaultFallback = fallback || React.createElement('div', null, 'Cargando...');
  
  if (loading) {
    return React.createElement(React.Fragment, null, defaultFallback);
  }
  
  if (!user) {
    return null; // El middleware se encargará de la redirección
  }
  
  if (requiredRole === 'admin' && !hasAdminPermissions(user)) {
    return React.createElement('div', null, 'No tienes permisos para acceder a esta página.');
  }
  
  return React.createElement(React.Fragment, null, children);
}