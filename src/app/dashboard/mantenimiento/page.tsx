// src/app/dashboard/mantenimiento/page.tsx
import { Suspense } from 'react';
import { MaintenanceReportsView } from '@/components/maintenance/maintenance-reports-view';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';

export default function MaintenancePage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      }>
        <MaintenanceReportsView />
      </Suspense>
    </div>
  );
}

export const metadata = {
  title: 'Reportes de Mantenimiento - AIP',
  description: 'Análisis automático y recomendaciones de mantenimiento basadas en historial',
};