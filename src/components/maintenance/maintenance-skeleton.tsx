'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MaintenanceSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      
      {/* Tabs skeleton */}
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Category tabs skeleton */}
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-28" />
      </div>
      
      {/* Cards grid skeleton */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <MaintenanceCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function MaintenanceCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Progress bar skeleton */}
      <div className="h-1 bg-gray-200">
        <Skeleton className="h-full w-3/4" />
      </div>
      
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        {/* Progress section */}
        <div className="space-y-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between mt-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </div>
        
        {/* Status section */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        
        {/* Teacher context skeleton */}
        <div className="bg-purple-50 rounded-lg p-3 mb-4">
          <Skeleton className="h-3 w-32 mb-1" />
          <Skeleton className="h-4 w-40 mb-1" />
          <Skeleton className="h-3 w-36 mb-1" />
          <Skeleton className="h-3 w-28" />
        </div>
        
        {/* Footer */}
        <div className="border-t pt-3 mt-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MaintenanceTableSkeleton() {
  return (
    <div className="space-y-6">
      <MaintenanceSkeleton />
    </div>
  );
}