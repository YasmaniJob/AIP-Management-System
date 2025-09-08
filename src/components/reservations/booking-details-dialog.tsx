// src/components/reservations/booking-details-dialog.tsx
'use client';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Calendar, Briefcase, BookOpen, GraduationCap, Grid3x3, Trash2, Edit, Building, UserCheck, UserX, CheckCircle, XCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { RescheduleDialog } from './reschedule-dialog';
import { areaColorMap } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { deleteBookingAction, markAttendanceAction } from '@/lib/actions/reservations';
import { useRouter } from 'next/navigation';
import { useServerAction } from '@/hooks/use-server-action';
import type { Booking, PedagogicalHour, Area, GradeWithSections, User as UserType } from '@/lib/types';

interface BookingDetailsDialogProps {
    booking: Booking & { 
        teacher?: UserType, 
        area?: { name: string }, 
        grade?: { name: string }, 
        section?: { name: string },
        attendance_status?: 'attended' | 'not_attended' | null
    };
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    hours: PedagogicalHour[];
    teachers: UserType[];
    areas: Area[];
    gradesWithSections: GradeWithSections[];
    initialBookings: Booking[];
    userRole: string;
    userId: string;
}

export function BookingDetailsDialog({ booking, isOpen, setIsOpen, hours, teachers, areas, gradesWithSections, initialBookings, userRole, userId }: BookingDetailsDialogProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const router = useRouter();
    
    const { execute: executeDeleteBooking, isPending: isCanceling } = useServerAction(
        deleteBookingAction,
        {
            successMessage: 'Reserva cancelada exitosamente',
            onSuccess: () => {
                setIsOpen(false);
                setIsConfirmOpen(false);
                router.refresh();
            }
        }
    );
    
    const { execute: executeMarkAttendance, isPending: isMarkingAttendance } = useServerAction(
        markAttendanceAction,
        {
            onSuccess: () => {
                router.refresh();
            }
        }
    );

    const hour = hours.find(h => h.id === booking.hour_id);
    const teacher = booking.teacher;
    
    const grade = booking.grade;
    const section = booking.section;
    const areaName = booking.area?.name;

    const handleCancelClick = () => {
        setIsConfirmOpen(true);
    }
    
    const handleConfirmCancel = () => {
        executeDeleteBooking(booking.id);
    }

    const handleMarkAttendance = (attended: boolean) => {
        executeMarkAttendance(booking.id, attended ? 'attended' : 'not_attended');
    }

    const bookingColor = areaName ? areaColorMap[areaName] || areaColorMap['Default'] : areaColorMap['Default'];
    const formattedDate = useMemo(() => format(parseISO(booking.date), "EEEE, dd 'de' MMMM", { locale: es }), [booking.date]);
    const isInstitutional = booking.type === 'INSTITUTIONAL';
    const bookingDateTime = parseISO(`${booking.date}T${hour?.name?.split(' - ')[0] || '08:00'}:00`);
    const isBookingPast = isPast(bookingDateTime);
    const canMarkAttendance = isBookingPast && !booking.attendance_status;

    return (
        <>            <Dialog open={isOpen} onOpenChange={setIsOpen}>                <DialogContent                     className="sm:max-w-lg p-0 border-2"                    style={{ borderColor: bookingColor }}                >                    <DialogHeader                         className="p-6 pb-4 rounded-t-lg"                        style={{ backgroundColor: `${bookingColor}20`}}                    >
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md" style={{ backgroundColor: bookingColor }}>
                                    { isInstitutional ? 
                                        <Building className="h-5 w-5 text-white" /> : 
                                        <BookOpen className="h-5 w-5 text-white" />
                                    }
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold font-headline">{booking.activity}</DialogTitle>
                                    <DialogDescription className="font-medium" style={{ color: bookingColor }}>
                                        {isInstitutional ? 'Uso Institucional' : areaName}
                                    </DialogDescription>
                                </div>
                            </div>
                            {booking.attendance_status && (
                                <Badge 
                                    variant={booking.attendance_status === 'attended' ? 'default' : 'destructive'}
                                    className="flex items-center gap-1"
                                >
                                    {booking.attendance_status === 'attended' ? (
                                        <><CheckCircle className="h-3 w-3" /> Asistió</>
                                    ) : (
                                        <><XCircle className="h-3 w-3" /> No Asistió</>
                                    )}
                                </Badge>
                            )}
                         </div>
                    </DialogHeader>
                    <div className="px-6 pb-6 space-y-4">
                        {/* 1. Docente */}                        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${bookingColor}10` }}>                            <div                                 className="h-10 w-10 rounded-full border flex items-center justify-center"                                style={{ backgroundColor: `${bookingColor}20`, borderColor: bookingColor }}                            >                                <User className="h-5 w-5" style={{ color: bookingColor }} />                            </div>                            <div>                                <p className="font-semibold text-lg">{teacher?.name || 'Docente no asignado'}</p>                                <p className="text-sm" style={{ color: bookingColor }}>Docente a cargo</p>                            </div>                        </div>

                        {/* 2. Hora y Fecha */}                        <div className="grid grid-cols-2 gap-4 text-sm">                            <div className="flex items-start gap-3">                                <Calendar className="h-4 w-4 mt-0.5" style={{ color: bookingColor }} />                                <div>                                    <p className="text-xs" style={{ color: bookingColor }}>Fecha</p>                                    <p className="font-semibold capitalize">{formattedDate}</p>                                </div>                            </div>                            <div className="flex items-start gap-3">                                <Clock className="h-4 w-4 mt-0.5" style={{ color: bookingColor }} />                                <div>                                    <p className="text-xs" style={{ color: bookingColor }}>Hora</p>                                    <p className="font-semibold">{hour?.name || 'N/A'}</p>                                </div>                            </div>                        </div>

                        {/* 3. Grado y sección (solo para estudiantes) */}                        {!isInstitutional && (                             <div className="border-t pt-4" style={{ borderColor: `${bookingColor}30` }}>                                <p className="text-sm font-semibold mb-3" style={{ color: bookingColor }}>Dirigido a</p>                                <div className="grid grid-cols-2 gap-4 text-sm">                                    <div className="flex items-start gap-3">                                        <GraduationCap className="h-4 w-4 mt-0.5" style={{ color: bookingColor }} />                                        <div>                                            <p className="text-xs" style={{ color: bookingColor }}>Grado</p>                                            <p className="font-semibold">{grade?.name || 'No especificado'}</p>                                        </div>                                    </div>                                    <div className="flex items-start gap-3">                                        <Grid3x3 className="h-4 w-4 mt-0.5" style={{ color: bookingColor }} />                                        <div>                                            <p className="text-xs" style={{ color: bookingColor }}>Sección</p>                                            <p className="font-semibold">{section?.name || 'No especificada'}</p>                                        </div>                                    </div>                                </div>                            </div>                        )}

                        {/* Botones de acción con jerarquía clara */}                        <div className="border-t pt-4 space-y-4" style={{ borderColor: `${bookingColor}30` }}>
                            {/* Botón prominente: Registrar asistencia - solo para reservas pasadas sin estado */}                            {canMarkAttendance && (userRole === 'admin' || booking.teacher_id === userId) && (                                <Button                                     onClick={() => handleMarkAttendance(true)}                                    disabled={isMarkingAttendance}                                    className="w-full text-white font-semibold py-3 text-base"                                    style={{ backgroundColor: bookingColor, borderColor: bookingColor }}                                    size="lg"                                >                                    <UserCheck className="mr-2 h-5 w-5" />                                    {isMarkingAttendance ? 'Registrando asistencia...' : 'Registrar Asistencia'}                                </Button>                            )}
                            
                            {/* Botones secundarios como iconos con tooltips */}
                            {(userRole === 'admin' || booking.teacher_id === userId) && (
                                <div className="flex justify-center gap-4">
                                    {/* Botón "No asistió" - solo para administradores y reservas pasadas sin estado */}
                                    {userRole === 'admin' && canMarkAttendance && (
                                        <div className="flex flex-col items-center gap-1">
                                            <Button
                                                onClick={() => handleMarkAttendance(false)}
                                                disabled={isMarkingAttendance}
                                                variant="outline"
                                                size="icon"
                                                className="h-12 w-12 border-red-200 text-red-600 hover:bg-red-50"
                                            >
                                                <UserX className="h-5 w-5" />
                                            </Button>
                                            <span className="text-xs text-muted-foreground">No asistió</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-col items-center gap-1">
                                        <Button                                            onClick={() => setIsRescheduleOpen(true)}                                            disabled={isBookingPast}                                            variant="outline"                                            size="icon"                                            className="h-12 w-12"                                            style={{ borderColor: `${bookingColor}40`, color: bookingColor }}                                        >                                            <Edit className="h-5 w-5" />                                        </Button>
                                        <span className="text-xs text-muted-foreground">Reprogramar</span>
                                    </div>
                                    
                                    <div className="flex flex-col items-center gap-1">                                        <Button                                            onClick={handleCancelClick}                                            variant="outline"                                            size="icon"                                            disabled={isCanceling || isBookingPast}                                            className="h-12 w-12"                                            style={{ borderColor: `${bookingColor}40`, color: bookingColor }}                                        >                                            <Trash2 className="h-5 w-5" />                                        </Button>                                        <span className="text-xs text-muted-foreground">Cancelar</span>                                    </div>
                                </div>
                            )}
                            
                            {/* Mensaje informativo para docentes viendo reservas de otros */}
                            {userRole === 'teacher' && booking.teacher_id !== userId && (
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground">
                                        Solo puedes gestionar tus propias reservas
                                    </p>
                                </div>
                            )}
                        </div>
                        
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de cancelar esta reserva?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La reserva para <strong>{booking.activity}</strong> será eliminada permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, mantener</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive hover:bg-destructive/90">
                            {isCanceling ? <LoadingSpinner size="sm" /> : 'Sí, cancelar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
             <RescheduleDialog
                booking={booking}
                isOpen={isRescheduleOpen}
                setIsOpen={setIsRescheduleOpen}
                hours={hours}
                initialBookings={initialBookings}
                onSuccess={() => setIsOpen(false)} // Close details when reschedule is done
            />
        </>
    );
}

    