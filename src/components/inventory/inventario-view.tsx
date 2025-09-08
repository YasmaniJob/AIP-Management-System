
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { AddCategoryDialog } from './add-category-dialog';
import { CategoryCard } from './category-card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { EditCategoryDialog } from './edit-category-dialog';
import { deleteCategoryAction } from '@/lib/actions/inventory';
import { useServerAction } from '@/hooks/use-server-action';

interface InventarioViewProps {
    initialCategories: any[];
    userRole: string;
}

export function InventarioView({ initialCategories, userRole }: InventarioViewProps) {
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any | null>(null);


    const { toast } = useToast();
    const router = useRouter();

    // Removed automatic refresh to improve performance
    // Data will be refreshed when user navigates or performs actions


    
    const handleEdit = (category: any) => {
        setSelectedCategory(category);
        setIsEditCategoryOpen(true);
    };

    const handleDelete = (category: any) => {
        setSelectedCategory(category);
        setIsDeleteConfirmOpen(true);
    };

    const { execute: executeDeleteCategory, isPending: isDeleting } = useServerAction(
        deleteCategoryAction,
        {
            successMessage: 'Categoría eliminada exitosamente',
            onSuccess: () => {
                // Instead of just refreshing, push to the main inventory page
                // to avoid 404 if the user is on a deleted category's page.
                router.push('/inventario');
                router.refresh();
                setIsDeleteConfirmOpen(false);
            }
        }
    );

    const handleConfirmDelete = () => {
        if (!selectedCategory) return;
        executeDeleteCategory(selectedCategory.id);
    };
    
    const isAdmin = userRole === 'Administrador';

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Inventario</h1>
                {isAdmin && (
                    <Button onClick={() => setIsAddCategoryOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Categoría
                    </Button>
                )}
            </div>
            {initialCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {initialCategories.map((category) => (
                        <CategoryCard 
                            key={category.id} 
                            category={category}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            userRole={userRole}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">No hay categorías para mostrar.</p>
                    {isAdmin && (
                        <p className="text-sm text-muted-foreground mt-2">Empieza por añadir una nueva categoría.</p>
                    )}
                </div>
            )}
            <AddCategoryDialog isOpen={isAddCategoryOpen} setIsOpen={setIsAddCategoryOpen} />
            
            {selectedCategory && (
                <EditCategoryDialog 
                    isOpen={isEditCategoryOpen} 
                    setIsOpen={setIsEditCategoryOpen} 
                    category={selectedCategory} 
                />
            )}
            
            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la categoría 
                            <span className="font-bold"> &quot;{selectedCategory?.name}&quot;</span>.
                            No podrás eliminarla si todavía contiene recursos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
