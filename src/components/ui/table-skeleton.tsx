// src/components/ui/table-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
    rows?: number;
    layout?: 'table' | 'cards' | 'grid';
    className?: string;
}

export function TableSkeleton({ rows = 4, layout = 'table', className }: TableSkeletonProps) {
    if (layout === 'cards') {
        return (
            <div className={cn("space-y-4", className)}>
                {/* Search and actions skeleton */}
                <div className="flex justify-between items-center gap-4">
                    <Skeleton className="h-10 w-64" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                
                {/* Cards skeleton */}
                <div className="space-y-4">
                    {Array.from({ length: rows }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-5 w-24" />
                                            <Skeleton className="h-5 w-16" />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Skeleton className="h-6 w-16" />
                                            <Skeleton className="h-6 w-20" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                
                {/* Pagination skeleton */}
                <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (layout === 'grid') {
        return (
            <div className={cn("space-y-4", className)}>
                {/* Search and actions skeleton */}
                <div className="flex justify-between items-center gap-4">
                    <Skeleton className="h-10 w-64" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                
                {/* Grid skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: rows }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-4 w-4" />
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                
                {/* Pagination skeleton */}
                <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            </div>
        );
    }
    
    // Default table layout
    return (
        <CardContent className={className}>
            <div className="flex justify-end gap-2 mb-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        </CardContent>
    );
}
