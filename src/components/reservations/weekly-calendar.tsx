// src/components/reservations/weekly-calendar.tsx
'use client';
import { useState, useMemo, useEffect } from 'react';
import { format, parseISO, isToday, startOfWeek, addDays, isEqual } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Booking, PedagogicalHour } from '@/lib/types';
import { Button } from '../ui/button';
import { User as UserIcon, PlusCircle, Check } from 'lucide-react';
import { areaColorMap } from '@/lib/constants';
import { useIsMobile } from '@/hooks/use-mobile';

interface Slot {
    date: string;
    hour_id: string;
}

interface WeeklyCalendarProps {
  hours: PedagogicalHour[];
  initialBookings: Booking[];
  onSlotSelect: (date: string, hourId: string) => void;
  selectedSlots: Slot[];
  viewDate: Date;
  excludeBookingId?: string;
}

export function WeeklyCalendar({
  hours,
  initialBookings,
  onSlotSelect,
  selectedSlots,
  viewDate,
  excludeBookingId
}: WeeklyCalendarProps) {
    const [selectedDay, setSelectedDay] = useState(viewDate);
    const isMobile = useIsMobile();
    
    useMemo(() => {
        setSelectedDay(viewDate)
    }, [viewDate])

    const weekDays = useMemo(() => {
        const start = startOfWeek(viewDate, { weekStartsOn: 1 });
        return Array.from({ length: 5 }, (_, i) => addDays(start, i));
    }, [viewDate]);

    const bookingsBySlot = useMemo(() => {
        const map = new Map<string, any>();
        initialBookings
        .filter(b => b.id !== excludeBookingId)
        .forEach(booking => {
            // Validar que la fecha sea válida antes de parsearla
            if (booking.date && typeof booking.date === 'string' && booking.date.trim() !== '') {
                try {
                    const key = `${format(parseISO(booking.date), 'yyyy-MM-dd')}-${booking.hour_id}`;
                    const teacher = booking.teacher;
                    map.set(key, { ...booking, teacher });
                } catch (error) {
                    console.warn('Invalid date format for booking:', booking.id, booking.date);
                }
            }
        });
        return map;
    }, [initialBookings, excludeBookingId]);


    const handleSlotClick = (date: string, hourId: string) => {
        const isBooked = bookingsBySlot.has(`${date}-${hourId}`);
        if (!isBooked) {
          onSlotSelect(date, hourId);
        }
    };

    const renderDesktopView = () => (
        <div className="border rounded-lg">
            <table className="w-full table-fixed">
                <thead className="border-b">
                    <tr>
                        <th className="p-3 text-center font-semibold text-sm text-muted-foreground w-28">Hora</th>
                        {weekDays.map(day => (
                        <th key={day.toISOString()} className={cn("p-3 text-center border-l", isToday(day) && "bg-primary/10")}>
                            <p className="font-semibold text-sm capitalize">{format(day, 'EEEE', { locale: es })}</p>
                            <p className="text-xs text-muted-foreground">{format(day, 'dd/MM')}</p>
                        </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {hours.map(hour => (
                        <tr key={hour.id} className="border-b last:border-b-0">
                            <td className="p-3 text-center bg-muted border-r">
                                <p className="font-semibold text-sm">{hour.name}</p>
                            </td>
                            {weekDays.map(day => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const booking = bookingsBySlot.get(`${dateStr}-${hour.id}`);
                                const isBooked = !!booking;
                                const isSelected = selectedSlots.some(s => s.date === dateStr && s.hour_id === hour.id);

                                return (
                                    <td key={day.toISOString()} className={cn("p-1 border-l align-top", isToday(day) && "bg-primary/5")}>
                                        <button
                                            type="button"
                                            onClick={() => handleSlotClick(dateStr, hour.id)}
                                            disabled={isBooked}
                                            className={cn(
                                                "w-full h-24 text-center transition-colors text-xs font-medium p-1 rounded-md relative",
                                                isBooked ? "cursor-not-allowed" : "hover:bg-accent/50",
                                                isSelected && "border-2 border-primary bg-primary/10"
                                            )}
                                        >
                                            {isBooked ? (
                                                <div 
                                                    className="w-full h-full text-left p-2 rounded-md flex flex-col justify-between"
                                                    style={{
                                                        backgroundColor: `${areaColorMap[booking.area as keyof typeof areaColorMap] || areaColorMap['Default']}20`,
                                                        borderLeft: `4px solid ${areaColorMap[booking.area as keyof typeof areaColorMap] || areaColorMap['Default']}`,
                                                    }}
                                                >
                                                    <p className="font-bold text-xs truncate" style={{ color: areaColorMap[booking.area as keyof typeof areaColorMap] || areaColorMap['Default'] }}>{booking.activity}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                        <UserIcon className="h-3 w-3" />
                                                        <span className="truncate">{booking.teacher?.name || '...'}</span>
                                                    </div>
                                                </div>
                                            ) : isSelected ? (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                                        <Check className="h-3 w-3" />
                                                    </div>
                                                </div>
                                            ): null}
                                        </button>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
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
            <div className="space-y-2 border rounded-lg p-2">
                {hours.map(hour => {
                    const dateStr = format(selectedDay, 'yyyy-MM-dd');
                    const booking = bookingsBySlot.get(`${dateStr}-${hour.id}`);
                    const isBooked = !!booking;
                    const isSelected = selectedSlots.some(s => s.date === dateStr && s.hour_id === hour.id);

                    return (
                        <div key={hour.id} className="flex items-center gap-3">
                            <div className="w-20 text-center text-sm font-semibold text-muted-foreground">{hour.name}</div>
                            <div className="flex-1 border-l pl-3">
                                <button
                                    type="button"
                                    onClick={() => handleSlotClick(dateStr, hour.id)}
                                    disabled={isBooked}
                                    className={cn(
                                        "w-full text-left p-3 rounded-md flex items-center justify-between min-h-16 transition-colors",
                                        isBooked && 'cursor-not-allowed',
                                        isSelected ? "bg-primary/10 border border-primary" : "bg-muted hover:bg-accent/50"
                                    )}
                                >
                                     {isBooked ? (
                                        <div 
                                            className="w-full h-full text-left rounded-md flex justify-between"
                                        >
                                            <div>
                                                <p className="font-bold text-sm" style={{ color: areaColorMap[booking.area as keyof typeof areaColorMap] || areaColorMap['Default'] }}>{booking.activity}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                    <UserIcon className="h-3 w-3" />
                                                    <span>{booking.teacher?.name || '...'}</span>
                                                </div>
                                            </div>
                                        </div>
                                     ) : (
                                        <>
                                            <span className={cn(isSelected ? 'text-primary font-semibold' : 'text-muted-foreground')}>
                                                {isSelected ? 'Seleccionado' : 'Disponible'}
                                            </span>
                                            {isSelected ? <Check className="h-5 w-5 text-primary"/> : <PlusCircle className={cn('h-5 w-5', 'text-muted-foreground/50')} /> }
                                        </>
                                     )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
    
    if (isMobile === undefined) {
        return (
            <div className="border rounded-lg p-4 animate-pulse">
                <div className="h-48 w-full bg-muted rounded-md"></div>
            </div>
        )
    }

    return isMobile ? renderMobileView() : renderDesktopView();
}
