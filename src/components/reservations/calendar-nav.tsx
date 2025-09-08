// src/components/reservations/calendar-nav.tsx
'use client';

import { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';

interface CalendarNavProps {
    initialDate: string;
    onDateChange: (newDate: Date) => void;
}

export function CalendarNav({ initialDate, onDateChange }: CalendarNavProps) {
    const [currentDate, setCurrentDate] = useState(new Date(initialDate.replace(/-/g, '/')));
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    useEffect(() => {
        setCurrentDate(new Date(initialDate.replace(/-/g, '/')));
    }, [initialDate]);

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            onDateChange(date);
            setIsPopoverOpen(false);
        }
    }
    
    const goToPreviousWeek = () => onDateChange(subWeeks(currentDate, 1));
    const goToNextWeek = () => onDateChange(addWeeks(currentDate, 1));

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const formattedWeekRange = `Semana del ${format(weekStart, 'd')} al ${format(weekEnd, "d 'de' MMMM", { locale: es })}`;

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek} aria-label="Semana anterior">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-grow text-center text-sm font-medium text-primary bg-primary/10 px-4 py-2 border rounded-md whitespace-nowrap">
                {formattedWeekRange}
            </div>
            <Button variant="outline" size="icon" onClick={goToNextWeek} aria-label="Siguiente semana">
                <ChevronRight className="h-4 w-4" />
            </Button>

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button id="date" variant={"outline"} size="icon" aria-label="Abrir calendario">
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="single"
                        selected={currentDate}
                        onSelect={handleDateSelect}
                        weekStartsOn={1}
                    />
                </PopoverContent>
            </Popover>

            <Button
                variant="outline"
                onClick={() => onDateChange(new Date())}
            >
                Hoy
            </Button>
        </div>
    );
}
