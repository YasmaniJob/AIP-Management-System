'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

import { PlusCircle, Trash2, Pencil, ChevronRight, GraduationCap, Users, BookOpen } from 'lucide-react';

import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { AddSectionsDialog } from './add-sections-dialog';
import { EditGradeDialog } from './edit-grade-dialog';
import { EditSectionDialog } from './edit-section-dialog';
import { AddGradeDialog } from './add-grade-dialog';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { deleteGradeAction, deleteSectionAction } from '@/lib/actions/settings';
import { useServerAction } from '@/hooks/use-server-action';

interface GradesViewProps {
    initialGrades: any[];
    addButton?: React.ReactNode;
}

export function GradesView({ initialGrades, addButton }: GradesViewProps) {
    const [openGrades, setOpenGrades] = useState<Record<string, boolean>>({});

    const [isAddGradeDialogOpen, setIsAddGradeDialogOpen] = useState(false);
    const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
    const [isEditGradeDialogOpen, setIsEditGradeDialogOpen] = useState(false);
    const [isEditSectionDialogOpen, setIsEditSectionDialogOpen] = useState(false);

    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'grade' | 'section', id: string, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [editingGrade, setEditingGrade] = useState<any | null>(null);
    const [editingSection, setEditingSection] = useState<any | null>(null);
    const [currentGradeIdForSection, setCurrentGradeIdForSection] = useState<string | null>(null);
    
    const router = useRouter();
    
    const { execute: executeDeleteGrade, isPending: isDeletingGrade } = useServerAction(
        deleteGradeAction,
        {
            onSuccess: () => {
                setIsConfirmDeleteOpen(false);
                setItemToDelete(null);
                router.refresh();
            }
        }
    );
    
    const { execute: executeDeleteSection, isPending: isDeletingSection } = useServerAction(
        deleteSectionAction,
        {
            onSuccess: () => {
                setIsConfirmDeleteOpen(false);
                setItemToDelete(null);
                router.refresh();
            }
        }
    );



    const toggleGrade = (gradeId: string) => {
        setOpenGrades(prev => ({ ...prev, [gradeId]: !prev[gradeId] }));
    }

    const handleDeleteClick = (type: 'grade' | 'section', id: string, name: string) => {
        setItemToDelete({ type, id, name });
        setIsConfirmDeleteOpen(true);
    }
    
    const handleAddSectionClick = (gradeId: string) => {
        setCurrentGradeIdForSection(gradeId);
        setIsAddSectionDialogOpen(true);
    }

    const handleEditGradeClick = (grade: any) => {
        setEditingGrade(grade);
        setIsEditGradeDialogOpen(true);
    }

    const handleEditSectionClick = (section: any) => {
        setEditingSection(section);
        setIsEditSectionDialogOpen(true);
    }

    const handleConfirmDelete = () => {
        if (!itemToDelete) return;
        
        if (itemToDelete.type === 'grade') {
            executeDeleteGrade(itemToDelete.id);
        } else {
            executeDeleteSection(itemToDelete.id);
        }
    }
    
    return (
        <>

            
            <div className="space-y-4">
                {initialGrades.length > 0 ? initialGrades.map(grade => (
                    <Card 
                        key={grade.id} 
                        className="group border-l-4 border-l-blue-500 hover:border-l-blue-600 transition-colors"
                    >
                        <Collapsible
                            open={openGrades[grade.id] || false}
                            onOpenChange={() => toggleGrade(grade.id)}
                        >
                            <CollapsibleTrigger asChild>
                                <div className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-full">
                                                <GraduationCap className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <ChevronRight className={cn("h-4 w-4 transition-transform duration-200 text-muted-foreground", openGrades[grade.id] && "rotate-90")} />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-foreground">{grade.name}</span>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                                <Users className="h-3 w-3 mr-1" />
                                                {grade.sections.length} sección{grade.sections.length !== 1 ? 'es' : ''}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="hover:bg-green-50 hover:text-green-600" onClick={(e) => {e.stopPropagation(); handleAddSectionClick(grade.id)}}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Sección
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600" onClick={(e) => {e.stopPropagation(); handleEditGradeClick(grade)}}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={(e) => {e.stopPropagation(); handleDeleteClick('grade', grade.id, grade.name)}}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="px-4 pb-4">
                                     {grade.sections.length > 0 ? (
                                        <div className="border-t pt-4">
                                            <div className="grid gap-2">
                                                {grade.sections.map((section:any) => (
                                                    <div key={section.id} className="group flex items-center justify-between py-3 px-4 rounded-lg border hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1.5 bg-green-100 rounded-full">
                                                                <BookOpen className="h-4 w-4 text-green-600" />
                                                            </div>
                                                            <span className="font-medium text-foreground">{section.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleEditSectionClick(section)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteClick('section', section.id, section.name)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                     ) : (
                                        <div className="text-center py-8 border-t">
                                            <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-3">
                                                <Users className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">Este grado aún no tiene secciones.</p>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="mt-3 hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                                                onClick={() => handleAddSectionClick(grade.id)}
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Añadir primera sección
                                            </Button>
                                        </div>
                                     )}
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>
                )) : (
                    <Card className="border-dashed border-2 border-gray-300">
                        <CardContent className="p-12 text-center">
                            <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                                <GraduationCap className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground mb-2">No hay grados configurados</h3>
                            <p className="text-muted-foreground mb-6">Comienza añadiendo tu primer grado para organizar las secciones.</p>
                            <p className="text-sm text-muted-foreground">Usa el botón "Añadir Grado" en la parte superior para comenzar.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
            

            <AddGradeDialog 
                isOpen={isAddGradeDialogOpen} 
                setIsOpen={setIsAddGradeDialogOpen} 
            />
            <AddSectionsDialog
                isOpen={isAddSectionDialogOpen}
                setIsOpen={setIsAddSectionDialogOpen}
                gradeId={currentGradeIdForSection}
            />
            {editingGrade && (
                <EditGradeDialog
                    isOpen={isEditGradeDialogOpen}
                    setIsOpen={setIsEditGradeDialogOpen}
                    grade={editingGrade}
                />
            )}
            {editingSection && (
                <EditSectionDialog
                    isOpen={isEditSectionDialogOpen}
                    setIsOpen={setIsEditSectionDialogOpen}
                    section={editingSection}
                />
            )}
            <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente
                        <span className="font-bold"> &quot;{itemToDelete?.name}&quot;</span>.
                        {itemToDelete?.type === 'grade' && ' También se eliminarán todas sus secciones asociadas.'}
                        No podrás eliminarlo si está asociado a algún préstamo existente.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeletingGrade || isDeletingSection}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeletingGrade || isDeletingSection} className="bg-destructive hover:bg-destructive/90">
                        {(isDeletingGrade || isDeletingSection) && <LoadingSpinner className="mr-2 h-4 w-4" />}
                        {(isDeletingGrade || isDeletingSection) ? 'Eliminando...' : 'Sí, eliminar'}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
