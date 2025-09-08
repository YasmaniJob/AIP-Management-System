// src/components/reservations/reservations-header.tsx
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Search } from 'lucide-react';
import { CalendarNav } from './calendar-nav';

interface ReservationsHeaderProps {
    initialDate: string;
    userRole: string;
}

export function ReservationsHeader({ initialDate, userRole }: ReservationsHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const isTeacher = userRole === 'Docente';
    
    const updateURL = (newDate: Date) => {
        const params = new URLSearchParams(searchParams);
        params.set('date', format(newDate, 'yyyy-MM-dd'));
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <h1 className="text-3xl font-bold font-headline">{isTeacher ? "Mis Reservas" : "Gestión de Reservas"}</h1>
                 <div className="flex items-center gap-2">
                    {!isTeacher && (
                        <Button asChild variant="outline">
                            <Link href="/reservas/buscar">
                                <Search className="mr-2 h-4 w-4" />
                                Buscar por Docente
                            </Link>
                        </Button>
                    )}
                    <Button asChild>
                        <Link href={`/reservas/nuevo?date=${initialDate}`}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nueva Reserva
                        </Link>
                    </Button>
                </div>
            </div>
            <CalendarNav 
                initialDate={initialDate}
                onDateChange={updateURL}
            />
        </div>
    )
}
