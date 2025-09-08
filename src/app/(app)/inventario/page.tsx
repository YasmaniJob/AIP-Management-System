// src/app/(app)/inventario/page.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { InventarioView } from '@/components/inventory/inventario-view';
import { categoryService } from '@/lib/services/category-service';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

function CategoriesSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
            ))}
        </div>
    )
}

async function CategoriesList() {
    const categoriesResponse = await categoryService.getCategoriesByContext('inventory');
    const categories = categoriesResponse.success ? categoriesResponse.data : [];
    
    // Get user role
    const supabase = await createServerClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    const { data: profile } = await supabase.from('users').select('role').eq('id', userId!).single();
    const userRole = profile?.role || 'Docente';
    
    return (
        <InventarioView initialCategories={categories} userRole={userRole} />
    )
}

export default async function InventarioPage() {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesList />
    </Suspense>
  );
}
