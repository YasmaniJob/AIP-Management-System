

'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { format, parseISO, startOfWeek, endOfWeek, addDays, isToday, addWeeks, subWeeks, isEqual } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PlusCircle, Search, User as UserIcon } from 'lucide-react';
import { BookingDetailsDialog } from './booking-details-dialog';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { Combobox } from '../ui/combobox';
import { areaColorMap } from '@/lib/constants';
import type { Booking, PedagogicalHour, Area, GradeWithSections, User } from '@/lib/types';
import { searchUsersAction } from '@/lib/actions/users';
import { useServerAction } from '@/hooks/use-server-action';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReservationsCalendarProps {
  initialDate: string;
  hours: PedagogicalHour[];
  initialBookings: Booking[];
  areas: Area[];
  gradesWithSections: GradeWithSections[];
  teachers: User[];
  userRole: string;
  userId: string;
}

export function ReservationsCalendar({
  initialDate,
  hours,
  initialBookings,
  areas,
  gradesWithSections,
  teachers: initialTeachers,
  userRole,
  userId
}: ReservationsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(initialDate.replace(/-/g, '/')));
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const isMobile = useIsMobile();
  const [selectedDay, setSelectedDay] = useState(currentDate);
  
  const [teacherSearch, setTeacherSearch] = useState('');
  const [searchedTeachers, setSearchedTeachers] = useState<any[]>(initialTeachers);
  const { execute: searchUsers, isLoading: isSearching } = useServerAction(searchUsersAction, {
    onSuccess: (result) => {
      if (result.success && result.data) {
        setSearchedTeachers(result.data.filter(u => u.role === 'Docente' || u.role === 'Administrador'));
      } else {
        setSearchedTeachers([]);
      }
    }
  });
  const debouncedSearchTerm = useDebounce(teacherSearch, 300);

  useEffect(() => {
    setCurrentDate(new Date(initialDate.replace(/-/g, '/')));
    setSelectedDay(new Date(initialDate.replace(/-/g, '/')));
  }, [initialDate]);


  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      searchUsers(debouncedSearchTerm);
    } else {
      setSearchedTeachers(initialTeachers);
    }
  }, [debouncedSearchTerm, initialTeachers, searchUsers]);

  const weekStartsOn = 1; // Lunes
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn });
    return Array.from({ length: 5 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const bookingsBySlot = useMemo(() => {
    const map = new Map<string, any>();
    initialBookings.forEach(booking => {
      const key = `${format(parseISO(booking.date), 'yyyy-MM-dd')}-${booking.hour_id}`;
      const teacher = initialTeachers.find(t => t.id === booking.teacher_id);
      map.set(key, { ...booking, teacher });
    });
    return map;
  }, [initialBookings, initialTeachers]);
  
  const handleSlotClick = (booking: any) => {
    // Restricción de privacidad: docentes solo pueden ver sus propias reservas
    if (userRole === 'Docente' && booking.teacher_id !== userId) {
      return; // No abrir el modal para reservas de otros docentes
    }
    
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  }

  const teacherOptions = useMemo(() => {
    return initialTeachers.map(t => ({ label: t.name, value: t.id }));
  }, [initialTeachers]);
  
  const renderDesktopView = () => (
    <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-6 items-center bg-muted">
          <div className="p-3 text-center font-semibold text-sm">Hora</div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className={cn("p-3 text-center border-l", isToday(day) && "bg-primary/10")}>
              <p className="font-semibold text-sm capitalize">{format(day, 'EEEE', { locale: es })}</p>
              <p className="text-xs text-muted-foreground">{format(day, 'dd/MM')}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1">
          {hours.map(hour => (
            <div key={hour.id} className="grid grid-cols-6 border-t items-stretch">
              <div className="p-3 text-center bg-muted flex items-center justify-center">
                <div>
                  <p className="font-semibold text-sm">{hour.name}</p>
                </div>
              </div>
              {weekDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const booking = bookingsBySlot.get(`${dateStr}-${hour.id}`);
                const teacher = booking?.teacher;
                const bookingColor = booking?.area ? areaColorMap[booking.area] || areaColorMap['Default'] : areaColorMap['Default'];
                const isOwnBooking = userRole === 'Docente' && booking?.teacher_id === userId;
                
                return (
                  <div key={day.toISOString()} className={cn("border-l p-2 min-h-24", isToday(day) && "bg-primary/5")}>
                    {booking ? (
                      <button 
                        onClick={() => handleSlotClick(booking)}
                        className={cn(
                          "w-full h-full text-left p-2 rounded-md hover:shadow-lg transition-all flex flex-col justify-between",
                          isOwnBooking && "ring-2 ring-primary ring-offset-2"
                        )}
                        style={{
                          backgroundColor: `${bookingColor}20`, // 12% opacity
                          borderTop: `3px solid ${bookingColor}`,
                        }}
                      >
                        <p className="font-bold text-xs" style={{ color: bookingColor }}>{booking.activity}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <UserIcon className="h-3 w-3" />
                          <span>{teacher?.name || 'Cargando...'}</span>
                        </div>
                      </button>
                    ) : (
                       <Link href={`/reservas/nuevo?date=${dateStr}&hour=${hour.id}`} className="w-full h-full" aria-label={`Crear reserva para ${dateStr} a las ${hour.name}`}></Link>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
  );

  const renderMobileView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-1">
        {weekDays.map(day => (
          <Button
            key={day.toISOString()}
            variant={isEqual(day, selectedDay) ? 'default' : 'outline'}
            onClick={() => setSelectedDay(day)}
            className="flex-col h-auto"
          >
            <span className="text-xs capitalize">{format(day, 'EEE', { locale: es })}</span>
            <span className="font-bold">{format(day, 'dd')}</span>
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        {hours.map(hour => {
          const dateStr = format(selectedDay, 'yyyy-MM-dd');
          const booking = bookingsBySlot.get(`${dateStr}-${hour.id}`);
          const teacher = booking?.teacher;
          const bookingColor = booking?.area ? areaColorMap[booking.area] || areaColorMap['Default'] : areaColorMap['Default'];
          const isOwnBooking = userRole === 'Docente' && booking?.teacher_id === userId;

          return (
            <div key={hour.id} className="flex items-center gap-3">
              <div className="w-20 text-center text-sm font-semibold text-muted-foreground">{hour.name}</div>
              <div className="flex-1 border rounded-lg">
                {booking ? (
                   <button 
                        onClick={() => handleSlotClick(booking)}
                        className={cn(
                          "w-full h-full text-left p-3 rounded-md flex items-center justify-between",
                          isOwnBooking && "ring-2 ring-primary"
                        )}
                        style={{
                          backgroundColor: `${bookingColor}20`,
                          borderLeft: `4px solid ${bookingColor}`,
                        }}
                      >
                        <div>
                          <p className="font-bold text-sm" style={{ color: bookingColor }}>{booking.activity}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <UserIcon className="h-3 w-3" />
                            <span>{teacher?.name || 'Cargando...'}</span>
                          </div>
                        </div>
                      </button>
                ) : (
                  <Link href={`/reservas/nuevo?date=${dateStr}&hour=${hour.id}`} className="w-full h-full flex items-center justify-center min-h-16 text-muted-foreground hover:bg-accent/50 rounded-md transition-colors" aria-label={`Crear reserva para ${dateStr} a las ${hour.name}`}>
                    <PlusCircle className="h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {isMobile === undefined ? (
        // You can render a skeleton here while waiting for the hook to determine the device type
        <div className="border rounded-lg overflow-hidden animate-pulse">
            <div className="grid grid-cols-6 h-14 bg-muted/50"></div>
            <div className="grid grid-cols-1 divide-y">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-6 h-24 divide-x">
                       <div className="bg-muted/50"></div>
                       <div></div>
                       <div></div>
                       <div></div>
                       <div></div>
                       <div></div>
                    </div>
                ))}
            </div>
        </div>
      ) : isMobile ? renderMobileView() : renderDesktopView()}
      
       {selectedBooking && isDetailsOpen && (
        <BookingDetailsDialog
            booking={selectedBooking}
            isOpen={isDetailsOpen}
            setIsOpen={setIsDetailsOpen}
            hours={hours}
            teachers={initialTeachers}
            areas={areas}
            gradesWithSections={gradesWithSections}
            initialBookings={initialBookings}
            userRole={userRole}
            userId={userId}
        />
       )}
    </div>
  );
}
