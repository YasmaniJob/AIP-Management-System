// src/components/settings/hours-view.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil, Clock, Calendar } from 'lucide-react';

import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useServerAction } from '@/hooks/use-server-action';
import { EditHourDialog } from './edit-hour-dialog';
import { AddHoursDialog } from './add-hours-dialog';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { deleteHourAction } from '@/lib/actions/settings';

interface HoursViewProps {
    initialHours: any[];
}

export function HoursView({ initialHours }: HoursViewProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState<any | null>(null);
    const { execute: deleteHour, isLoading: isDeleting } = useServerAction(deleteHourAction, {
        successMessage: 'Hora eliminada exitosamente',
        onSuccess: () => {
            setIsConfirmOpen(false);
            setSelectedHour(null);
        }
    });

    // Ordenar horas por hour_order
    const sortedHours = [...initialHours].sort((a, b) => a.hour_order - b.hour_order);

    const handleEditClick = (hour: any) => {
        setSelectedHour(hour);
        setIsEditDialogOpen(true);
    }

    const handleDeleteClick = (hour: any) => {
        setSelectedHour(hour);
        setIsConfirmOpen(true);
    }

    const handleConfirmDelete = async () => {
        if (!selectedHour) return;
        await deleteHour(selectedHour.id);
    }

    return (
        <>

            
            <div className="space-y-3">
                {sortedHours.length > 0 ? sortedHours.map(hour => (
                    <Card 
                        key={hour.id}
                        className="group overflow-hidden border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all duration-200 hover:border-l-orange-600"
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full">
                                        <Clock className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-semibold px-3 py-1">
                                            #{hour.hour_order}
                                        </Badge>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{hour.name}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Hora pedagógica
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(hour)} className="hover:bg-orange-50">
                                        <Pencil className="h-4 w-4 text-orange-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(hour)} className="hover:bg-red-50">
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )) : (
                    <Card className="border-dashed border-2 border-muted-foreground/25">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Clock className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">No hay horas pedagógicas configuradas</h3>
                            <p className="text-muted-foreground mb-6">Comienza añadiendo las horas pedagógicas para organizar el horario escolar.</p>
                            <p className="text-sm text-muted-foreground">Usa el botón "Añadir Horas Pedagógicas" en la parte superior para comenzar.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
            

            <AddHoursDialog 
                isOpen={isAddDialogOpen} 
                setIsOpen={setIsAddDialogOpen} 
            />
            {selectedHour && (
                <EditHourDialog
                    isOpen={isEditDialogOpen}
                    setIsOpen={setIsEditDialogOpen}
                    hour={selectedHour}
                />
            )}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la hora 
                            <span className="font-bold"> &quot;{selectedHour?.name}&quot;</span>. 
                            No podrás eliminarla si está asociada a alguna reserva existente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                        {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
