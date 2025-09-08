'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

import { AddAreasDialog } from './add-areas-dialog';
import { EditAreaDialog } from './edit-area-dialog';

import { PlusCircle, Trash2, Pencil, BookOpen } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { deleteAreaAction } from '@/lib/actions/settings';
import { useServerAction } from '@/hooks/use-server-action';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';



interface AreasViewProps {
    initialAreas: any[];
}

export function AreasView({ initialAreas }: AreasViewProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedArea, setSelectedArea] = useState<any | null>(null);




    const { toast } = useToast();
    const router = useRouter();

    const handleEditClick = (area: any) => {
        setSelectedArea(area);
        setIsEditDialogOpen(true);
    }

    const handleDeleteClick = (area: any) => {
        setSelectedArea(area);
        setIsConfirmOpen(true);
    }

    const { execute: executeDeleteArea, isLoading: isDeleting } = useServerAction(
        deleteAreaAction,
        {
            successMessage: 'Área eliminada exitosamente',
            onSuccess: () => {
                setSelectedArea(null);
                setIsConfirmOpen(false);
            }
        }
    );

    const handleConfirmDelete = () => {
        if (!selectedArea) return;
        executeDeleteArea(selectedArea.id);
    }


    
    return (
        <div className="space-y-8">

            

                

            
            <div className="space-y-3">
                {initialAreas.length > 0 ? initialAreas.map((area, index) => (
                    <Card 
                        key={area.id}
                        className="group overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-200 hover:border-l-blue-600"
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">{area.name}</h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" />
                                            Área curricular
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(area)} className="hover:bg-blue-50">
                                        <Pencil className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(area)} className="hover:bg-red-50">
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
 : (
                    <Card className="border-dashed border-2 border-muted-foreground/25">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <BookOpen className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">No hay áreas académicas configuradas</h3>
                            <p className="text-muted-foreground mb-6">Comienza añadiendo las áreas curriculares que se utilizarán en los préstamos y reservas.</p>
                            <p className="text-sm text-muted-foreground">Usa el botón "Añadir Área" en la parte superior para comenzar.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
             <AddAreasDialog
                isOpen={isAddDialogOpen}
                setIsOpen={setIsAddDialogOpen}
            />
            {selectedArea && (
                <EditAreaDialog
                    isOpen={isEditDialogOpen}
                    setIsOpen={setIsEditDialogOpen}
                    area={selectedArea}
                />
            )}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el área 
                        <span className="font-bold"> &quot;{selectedArea?.name}&quot;</span>. 
                        No podrás eliminarla si está asociada a algún préstamo existente.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting && <LoadingSpinner className="mr-2 h-4 w-4" />}
                        {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
