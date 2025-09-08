// src/app/(app)/prestamos/solicitar/page.tsx
import { RequestLoanForm } from "@/components/loans/request-loan-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUsers } from "@/lib/data/users";
import { categoryService } from "@/lib/services/category-service";
import { getResourcesByCategoryId } from "@/lib/data/inventory";
import { getAreas, getGradesWithSections } from "@/lib/data/settings";
import { getActiveLoans } from "@/lib/data/loans";
import { Resource } from "@/lib/types";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SolicitarPrestamoPage() {
    const supabase = await createServerClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
        redirect('/');
    }

    // Verificar que el usuario sea docente
    const { data: profile } = await supabase.from('users').select('role').eq('id', userId).single();
    if (profile?.role !== 'Docente') {
        redirect('/prestamos');
    }

    const categoriesPromise = categoryService.getCategoriesByContext('loans');
    const areasPromise = getAreas();
    const gradesWithSectionsPromise = getGradesWithSections();
    const activeLoansPromise = getActiveLoans();

    const [
        categoriesResponse, 
        areas, 
        gradesWithSections, 
        activeLoans
    ] = await Promise.all([
        categoriesPromise,
        areasPromise,
        gradesWithSectionsPromise,
        activeLoansPromise
    ]);

    // Extract categories from response
    const categories = categoriesResponse.success ? categoriesResponse.data || [] : [];

    const resourcePromises = categories.map(category => getResourcesByCategoryId(category.id));
    const allResourcesNested = await Promise.all(resourcePromises);
    const initialResources: Resource[] = allResourcesNested.flat();

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Breadcrumbs items={[
                    { label: 'Préstamos', href: '/prestamos' },
                    { label: 'Solicitar Préstamo' }
                ]} />
                 <Button variant="outline" asChild>
                    <Link href="/prestamos">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Atrás
                    </Link>
                </Button>
            </div>
            
            <RequestLoanForm 
                categories={categories}
                initialResources={initialResources}
                areas={areas}
                gradesWithSections={gradesWithSections}
                activeLoans={activeLoans}
                currentUserId={userId}
            />
        </div>
    );
}