'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UsersView } from './users-view';
import { AddUserDialog } from './add-user-dialog';

interface DocentesViewClientProps {
  initialUsers: any[];
  allowRegistration: boolean;
}

export function DocentesViewClient({ initialUsers, allowRegistration }: DocentesViewClientProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center mb-4 px-6 pt-4">
        <h1 className="text-3xl font-bold font-headline">Docentes ({initialUsers.length})</h1>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Añadir Docente
        </Button>
      </div>
      
      <UsersView 
        initialUsers={initialUsers}
        role="Docente"
        allowRegistration={allowRegistration}
      />
      
      <AddUserDialog 
        isOpen={isAddDialogOpen}
        setIsOpen={setIsAddDialogOpen}
        role="Docente"
      />
    </>
  );
}