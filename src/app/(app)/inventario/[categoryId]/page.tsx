
// src/app/(app)/inventario/[categoryId]/page.tsx
import { ResourcesView } from '@/components/inventory/resources-view';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { categoryService } from '@/lib/services/category-service';
import { getResourcesByCategoryId } from '@/lib/data/inventory';
import { getActiveLoans } from '@/lib/data/loans';
import { getMaintenanceRecordsWithIncidents } from '@/lib/data/maintenance-fallback';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

function ResourcesSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-9 w-64" />
            <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-28" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    )
}

async function ResourceList({ categoryId, userRole }: { categoryId: string; userRole: string }) {
    // These calls are safe because the parent page already validated the category exists.
    const category = await categoryService.getCategoryById(categoryId);
    const resources = await getResourcesByCategoryId(categoryId);
    const activeLoans = await getActiveLoans();
    const maintenanceRecords = await getMaintenanceRecordsWithIncidents();
    
    // Add resource statistics to match the category data structure used in cards
    const categoryWithStats = {
        ...category!,
        resourceCount: resources.length,
        availableCount: resources.filter(r => r.status === 'Disponible').length
    };
    
    return (
        <ResourcesView 
            category={categoryWithStats} 
            initialResources={resources}
            activeLoans={activeLoans}
            maintenanceRecords={maintenanceRecords}
            userRole={userRole}

        />
    )
}

export default async function CategoryDetailPage({ params }: { params: { categoryId: string } }) {
    const { categoryId } = await params;
    
    // Get user role
    const supabase = await createServerClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    const { data: profile } = await supabase.from('users').select('role').eq('id', userId!).single();
    const userRole = profile?.role || 'Docente';
    
    // Fetch category data once at the page level
    const category = await categoryService.getCategoryById(categoryId);

    // If category does not exist, render 404 page before doing anything else
    if (!category) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Breadcrumbs items={[
                    { label: 'Inventario', href: '/inventario' },
                    { label: category.name }
                ]} />
                <Button variant="outline" asChild>
                    <Link href="/inventario">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Atrás
                    </Link>
                </Button>
            </div>
            <Suspense fallback={<ResourcesSkeleton />}>
                <ResourceList categoryId={categoryId} userRole={userRole} />
            </Suspense>
        </div>
    );
}
