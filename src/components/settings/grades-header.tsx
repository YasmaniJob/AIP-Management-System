'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddGradeDialog } from './add-grade-dialog';

export function GradesHeader() {
    const [isAddGradeDialogOpen, setIsAddGradeDialogOpen] = useState(false);

    return (
        <>
            <Button 
                onClick={() => setIsAddGradeDialogOpen(true)} 
                className="bg-primary hover:bg-primary/90 shadow-md"
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Grado
            </Button>
            
            <AddGradeDialog 
                isOpen={isAddGradeDialogOpen} 
                setIsOpen={setIsAddGradeDialogOpen} 
            />
        </>
    );
}