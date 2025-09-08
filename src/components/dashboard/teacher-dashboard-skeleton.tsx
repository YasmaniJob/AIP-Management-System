// src/components/dashboard/teacher-dashboard-skeleton.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TeacherDashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-96" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-12 mb-1" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Upcoming bookings skeleton */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-5 w-16" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Active loans skeleton */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <Skeleton className="h-5 w-16" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <div className="flex gap-1">
                                            <Skeleton className="h-5 w-16" />
                                            <Skeleton className="h-5 w-20" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Weekly activity chart skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>

                {/* Resource usage chart skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-52" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}