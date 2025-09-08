// src/components/settings/hours-header.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddHoursDialog } from './add-hours-dialog';

export function HoursHeader() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    return (
        <>
            <Button 
                onClick={() => setIsAddDialogOpen(true)} 
                className="bg-primary hover:bg-primary/90 shadow-md"
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Horas Pedagógicas
            </Button>
            
            <AddHoursDialog 
                isOpen={isAddDialogOpen} 
                setIsOpen={setIsAddDialogOpen} 
            />
        </>
    );
}