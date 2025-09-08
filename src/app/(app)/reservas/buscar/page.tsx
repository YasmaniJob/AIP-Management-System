// src/app/(app)/reservas/buscar/page.tsx
import { SearchBookingsView } from '@/components/reservations/search-bookings-view';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllUsers } from '@/lib/data/users';
import { getGradesWithSections, getPedagogicalHours } from '@/lib/data/settings';
import { getBookings } from '@/lib/data/reservations';

function SearchSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
    )
}

export default async function SearchBookingsPage({
  searchParams,
}: {
  searchParams?: {
    teacherId?: string;
  };
}) {
    const params = await searchParams;
    const teacherId = params?.teacherId || '';
    
    const teachersPromise = getAllUsers();
    const gradesWithSectionsPromise = getGradesWithSections();
    const hoursPromise = getPedagogicalHours();
    const allBookingsPromise = getBookings({});

    const [teachers, gradesWithSections, hours, allBookings] = await Promise.all([
        teachersPromise,
        gradesWithSectionsPromise,
        hoursPromise,
        allBookingsPromise
    ]);

    const filteredBookings = teacherId ? allBookings.filter(b => b.teacher_id === teacherId) : [];
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Breadcrumbs items={[
                    { label: 'Reservas', href: '/reservas' },
                    { label: 'Buscar por Docente' }
                ]} />
                 <Button variant="outline" asChild>
                    <Link href="/reservas">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Atrás
                    </Link>
                </Button>
            </div>
            <Suspense fallback={<SearchSkeleton />}>
                <SearchBookingsView 
                    teachers={teachers}
                    initialBookings={filteredBookings}
                    allBookingsForReschedule={allBookings}
                    gradesWithSections={gradesWithSections}
                    hours={hours}
                    initialTeacherId={teacherId}
                />
            </Suspense>
        </div>
    );
}
