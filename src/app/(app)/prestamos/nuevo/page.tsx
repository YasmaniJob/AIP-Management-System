// src/app/(app)/prestamos/nuevo/page.tsx
import { NewLoanForm } from "@/components/loans/new-loan-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUsers } from "@/lib/data/users";
import { getCategoriesByContext } from "@/lib/services/category-service";
import { getResourcesByCategoryId } from "@/lib/data/inventory";
import { getAreas, getGradesWithSections } from "@/lib/data/settings";
import { getActiveLoans } from "@/lib/data/loans";
import { Resource } from "@/lib/types";

export default async function NuevoPrestamoPage() {
    const usersPromise = getUsers({ role: 'Docente' }).then(docentes => 
        getUsers({ role: 'Administrador' }).then(admins => [...docentes, ...admins])
    );
    const categoriesPromise = getCategoriesByContext('loans');
    const areasPromise = getAreas();
    const gradesWithSectionsPromise = getGradesWithSections();
    const activeLoansPromise = getActiveLoans();

    const [        users,         categories,         areas,         gradesWithSections,         activeLoans    ] = await Promise.all([        usersPromise,        categoriesPromise,        areasPromise,        gradesWithSectionsPromise,        activeLoansPromise    ]);

    const resourcePromises = categories.map(category => getResourcesByCategoryId(category.id));
    const allResourcesNested = await Promise.all(resourcePromises);
    const initialResources: Resource[] = allResourcesNested.flat();


    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Breadcrumbs items={[
                    { label: 'Préstamos', href: '/prestamos' },
                    { label: 'Nuevo Préstamo' }
                ]} />
                 <Button variant="outline" asChild>
                    <Link href="/prestamos">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Atrás
                    </Link>
                </Button>
            </div>
            <NewLoanForm 
                docentes={users}
                categories={categories}
                initialResources={initialResources}
                areas={areas}
                gradesWithSections={gradesWithSections}
                activeLoans={activeLoans}
            />
        </div>
    );
}
