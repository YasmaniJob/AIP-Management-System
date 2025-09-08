// src/components/users/admins-header.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddUserDialog } from './add-user-dialog';

export function AdminsHeader() {
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);

    return (
        <>
            <div className="flex items-center gap-2">
                <Button 
                    onClick={() => setIsAddUserOpen(true)}
                    className="bg-primary hover:bg-primary/90 shadow-md"
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Administrador
                </Button>
            </div>
            
            <AddUserDialog 
                isOpen={isAddUserOpen} 
                setIsOpen={setIsAddUserOpen} 
                role="Administrador" 
            />
        </>
    );
}