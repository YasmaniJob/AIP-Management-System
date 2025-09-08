// src/app/(app)/reservas/page.tsx
import { ReservationsCalendar } from "@/components/reservations/reservations-calendar";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ReservationsHeader } from "@/components/reservations/reservations-header";
import { getPedagogicalHours, getAreas, getGradesWithSections } from '@/lib/data/settings';
import { getBookings } from '@/lib/data/reservations';
import { getAllUsers } from '@/lib/data/users';
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[70vh] w-full" />
    </div>
  )
}


export default async function ReservasPage({
  searchParams,
}: {
  searchParams?: {
    date?: string;
  };
}) {
  const params = await searchParams;
  const selectedDate = params?.date ? new Date(params.date) : new Date();
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value || '';
  const supabase = await createServerClient();
  const { data: userProfile } = await supabase.from('users').select('role').eq('id', userId).single();
  const userRole = userProfile?.role || 'Docente';


  const hoursPromise = getPedagogicalHours();
  const bookingsPromise = getBookings({ 
    startDate: format(weekStart, 'yyyy-MM-dd'),
    endDate: format(weekEnd, 'yyyy-MM-dd')
  });
  const areasPromise = getAreas();
  const gradesPromise = getGradesWithSections();
  const teachersPromise = getAllUsers();

  const [hours, bookings, areas, grades, teachers] = await Promise.all([
    hoursPromise,
    bookingsPromise,
    areasPromise,
    gradesPromise,
    teachersPromise
  ]);

  return (
    <div className="space-y-6">
      <ReservationsHeader 
        initialDate={format(selectedDate, "yyyy-MM-dd")}
        userRole={userRole}
      />
      <Suspense fallback={<CalendarSkeleton />}>
        <ReservationsCalendar 
          initialDate={format(selectedDate, "yyyy-MM-dd")}
          hours={hours}
          initialBookings={bookings}
          areas={areas}
          gradesWithSections={grades}
          teachers={teachers}
          userRole={userRole}
          userId={userId}
        />
      </Suspense>
    </div>
  );
}
