// src/components/reservations/reschedule-dialog.tsx
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { WeeklyCalendar } from './weekly-calendar';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CalendarCheck, Clock } from 'lucide-react';
import { colors } from '@/lib/colors';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { rescheduleBookingAction } from '@/lib/actions/reservations';
import { useServerAction } from '@/hooks/use-server-action';

const rescheduleSchema = z.object({
    bookingId: z.string(),
    newDate: z.string().min(1, 'Debes seleccionar una nueva fecha.'),
    newHourId: z.string().min(1, 'Debes seleccionar una nueva hora.'),
});

interface RescheduleDialogProps {
    booking: any;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    hours: any[];
    initialBookings: any[];
    onSuccess: () => void;
}

export function RescheduleDialog({ booking, isOpen, setIsOpen, hours, initialBookings, onSuccess }: RescheduleDialogProps) {
    const { execute: executeReschedule, isPending: isSubmitting } = useServerAction(
        rescheduleBookingAction,
        {
            successMessage: 'La reserva ha sido reprogramada exitosamente',
            onSuccess: () => {
                onSuccess();
                setIsOpen(false);
            }
        }
    );
    
    const form = useForm<z.infer<typeof rescheduleSchema>>({
        resolver: zodResolver(rescheduleSchema),
        defaultValues: {
            bookingId: booking.id,
            newDate: '',
            newHourId: '',
        },
    });

    const handleSlotSelect = (date: string, hourId: string) => {
        form.setValue('newDate', date);
        form.setValue('newHourId', hourId);
    };

    const onSubmit = (values: z.infer<typeof rescheduleSchema>) => {
        executeReschedule(values);
    }
    
    const newDate = form.watch('newDate');
    const newHourId = form.watch('newHourId');
    const newHour = hours.find(h => h.id === newHourId);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Reprogramar Reserva</DialogTitle>
                    <DialogDescription>
                        Selecciona un nuevo horario disponible en el calendario para la actividad: <strong>{booking.activity}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Alert>
                            <CalendarCheck className="h-4 w-4" />
                            <AlertTitle>Horario Original</AlertTitle>
                            <AlertDescription>
                                {booking.date && typeof booking.date === 'string' && booking.date.trim() !== '' ? (
                                    format(parseISO(booking.date), "EEEE, dd 'de' MMMM", { locale: es })
                                ) : (
                                    'Fecha no válida'
                                )}
                                <br/>
                                {hours.find(h => h.id === booking.hour_id)?.name}
                            </AlertDescription>
                        </Alert>
                         <Alert variant={newDate && newHour ? 'default' : 'destructive'} className={newDate && newHour ? colors.success.border : ''}>
                            <Clock className="h-4 w-4" />
                            <AlertTitle>Nuevo Horario</AlertTitle>
                            <AlertDescription>
                                {newDate && newHour ? (
                                    <>
                                        {format(parseISO(newDate), "EEEE, dd 'de' MMMM", { locale: es })}
                                        <br/>
                                        {newHour.name}
                                    </>
                                ) : 'Selecciona un nuevo horario del calendario.'}
                            </AlertDescription>
                        </Alert>
                    </div>
                    <WeeklyCalendar
                        hours={hours}
                        initialBookings={initialBookings}
                        onSlotSelect={handleSlotSelect}
                        selectedDate={form.watch('newDate')}
                        selectedHourId={form.watch('newHourId')}
                        initialDate={booking.date}
                        excludeBookingId={booking.id}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || !newDate || !newHourId}>
                        {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
                        Confirmar Reprogramación
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
