// src/app/(app)/reservas/nuevo/page.tsx
import { NewBookingView } from "@/components/reservations/new-booking-view";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAreas, getGradesWithSections, getPedagogicalHours } from '@/lib/data/settings';
import { getBookings } from '@/lib/data/reservations';
import { getAllUsers } from "@/lib/data/users";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function NuevaReservaPage({
  searchParams,
}: {
  searchParams?: {
    date?: string;
    hour?: string;
  };
}) {
  const params = await searchParams;
  const initialDate = params?.date;
  const initialHourId = params?.hour;
  
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  if (!userId) redirect('/');
  
  const supabase = await createServerClient();
  const { data: userProfile } = await supabase.from('users').select('role').eq('id', userId).single();
  const userRole = userProfile?.role;
  if (!userRole) redirect('/');


  const areasPromise = getAreas();
  const gradesWithSectionsPromise = getGradesWithSections();
  const hoursPromise = getPedagogicalHours();
  const bookingsPromise = getBookings({});
  const usersPromise = getAllUsers();
  
  const [areas, gradesWithSections, hours, bookings, users] = await Promise.all([
    areasPromise,
    gradesWithSectionsPromise,
    hoursPromise,
    bookingsPromise,
    usersPromise
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Breadcrumbs items={[
          { label: 'Reservas', href: '/reservas' },
          { label: 'Crear Nueva Reserva' }
        ]} />
        <Button variant="outline" asChild>
          <Link href="/reservas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Atrás
          </Link>
        </Button>
      </div>
      <NewBookingView
        areas={areas}
        gradesWithSections={gradesWithSections}
        hours={hours}
        initialBookings={bookings}
        users={users}
        initialDate={initialDate}
        initialHourId={initialHourId}
        userRole={userRole}
        userId={userId}
      />
    </div>
  );
}
