
// src/components/reservations/search-bookings-view.tsx
'use client';
import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, GraduationCap, Grid3x3, Briefcase, Trash2, Edit, MoreHorizontal, ChevronsUpDown } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { RescheduleDialog } from './reschedule-dialog';
import { deleteBookingAction } from '@/lib/actions/reservations';
import { SelectUserDialog } from '../users/select-user-dialog';
import { useServerAction } from '@/hooks/use-server-action';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';

interface SearchBookingsViewProps {
    teachers: any[];
    initialBookings: any[];
    allBookingsForReschedule: any[];
    gradesWithSections: any[];
    hours: any[];
    initialTeacherId?: string;
}

export function SearchBookingsView({ teachers, initialBookings, allBookingsForReschedule, gradesWithSections, hours, initialTeacherId }: SearchBookingsViewProps) {
    const router = useRouter();
    const pathname = usePathname();
    
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false);
    
    const { execute: executeDeleteBooking, isPending: isCanceling } = useServerAction(
        deleteBookingAction,
        {
            successMessage: 'Reserva cancelada exitosamente',
            onSuccess: () => {
                setIsCancelConfirmOpen(false);
                router.refresh();
            }
        }
    );

    const selectedUser = useMemo(() => initialTeacherId ? teachers.find(p => p.id === initialTeacherId) : null, [teachers, initialTeacherId]);
    
    const handleSelectUser = (user: any) => {
        router.push(`${pathname}?teacherId=${user.id}`);
        setIsTeacherDialogOpen(false);
    }
    
    const getBookingDetails = (booking: any) => {
        if (booking.type === 'INSTITUTIONAL') {
            return <div className="flex items-center gap-2 text-xs text-muted-foreground"><Briefcase className="h-3 w-3"/>Uso Institucional</div>;
        }
        const grade = gradesWithSections.find(g => g.id === booking.grade_id);
        const section = grade?.sections.find((s:any) => s.id === booking.section_id);
        return (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><BookOpen className="h-3 w-3"/>{booking.area}</div>
                <div className="flex items-center gap-1"><GraduationCap className="h-3 w-3"/>{grade?.name}</div>
                <div className="flex items-center gap-1"><Grid3x3 className="h-3 w-3"/>{section?.name}</div>
            </div>
        )
    };

    const handleReschedule = (booking: any) => {
        setSelectedBooking(booking);
        setIsRescheduleOpen(true);
    };

    const handleCancel = (booking: any) => {
        setSelectedBooking(booking);
        setIsCancelConfirmOpen(true);
    };

    const handleConfirmCancel = () => {
        if (!selectedBooking) return;
        executeDeleteBooking(selectedBooking.id);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Buscar Reservas por Docente</CardTitle>
                    <CardDescription>Selecciona un docente para ver todas sus reservas activas.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex-grow space-y-2">
                        <Label>Docente</Label>
                        <Button
                            variant="outline"
                            className="w-full justify-between font-normal"
                            onClick={() => setIsTeacherDialogOpen(true)}
                            type="button"
                        >
                            {selectedUser ? selectedUser.name : 'Selecciona un usuario'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {initialTeacherId && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Resultados de la Búsqueda</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {initialBookings.length > 0 ? (
                                initialBookings.map((booking, index) => (
                                    <Card key={booking.id} className="shadow-none border">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="font-bold text-base">{booking.activity}</div>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <div className="font-medium capitalize">
                                                                {format(parseISO(booking.date), "EEEE, dd 'de' MMMM", { locale: es })}
                                                            </div>
                                                            <Badge variant="outline" className="font-semibold">
                                                                {hours.find(h => h.id === booking.hour_id)?.name}
                                                            </Badge>
                                                        </div>
                                                        <div className="mt-2">
                                                            {getBookingDetails(booking)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleReschedule(booking)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Reprogramar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleCancel(booking)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Cancelar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card className="shadow-none border">
                                    <CardContent className="p-8 text-center">
                                        <p className="text-muted-foreground">Este docente no tiene reservas activas.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
            <SelectUserDialog
                isOpen={isTeacherDialogOpen}
                setIsOpen={setIsTeacherDialogOpen}
                onSelectUser={handleSelectUser}
                users={teachers}
            />
             {selectedBooking && isRescheduleOpen && (
                <RescheduleDialog
                    booking={selectedBooking}
                    isOpen={isRescheduleOpen}
                    setIsOpen={setIsRescheduleOpen}
                    hours={hours}
                    initialBookings={allBookingsForReschedule}
                    onSuccess={() => {
                        setIsRescheduleOpen(false);
                        router.refresh();
                    }}
                />
            )}
            <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de cancelar esta reserva?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La reserva será eliminada permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCanceling}>No, mantener</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmCancel} disabled={isCanceling} className="bg-destructive hover:bg-destructive/90">
                            {isCanceling ? <LoadingSpinner className="mr-2 h-4 w-4"/> : null}
                        {isCanceling ? 'Cancelando...' : 'Sí, cancelar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
