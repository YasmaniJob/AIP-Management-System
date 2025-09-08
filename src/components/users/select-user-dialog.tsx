// src/components/users/select-user-dialog.tsx
'use client';
import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { Separator } from '../ui/separator';

interface SelectUserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSelectUser: (user: any) => void;
  users: any[];
}

export function SelectUserDialog({ isOpen, setIsOpen, onSelectUser, users }: SelectUserDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return users;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(lowercasedTerm) ||
      (user.dni && user.dni.includes(lowercasedTerm))
    );
  }, [searchTerm, users]);


  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Seleccionar Usuario</DialogTitle>
          <DialogDescription>Busca y selecciona al usuario (docente o admin) a cargo.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Buscar por nombre o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ScrollArea className="h-72 mt-4">
            <div className="pr-4 space-y-1">
              {users.length > 0 ? (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {searchTerm ? `Resultados para "${searchTerm}"` : `Mostrando ${users.length} usuarios`}
                      </div>
                      {filteredUsers.length > 0 ? filteredUsers.map((user, index) => (
                        <div key={user.id}>
                           {index > 0 && <Separator />}
                            <button
                                className="w-full flex items-center gap-3 p-2 rounded-md text-left hover:bg-accent transition-colors"
                                onClick={() => {
                                    onSelectUser(user);
                                    setIsOpen(false);
                                }}
                            >
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.role}</p>
                                </div>
                            </button>
                        </div>
                      )) : (
                         <p className="text-center text-sm text-muted-foreground pt-8">No se encontraron usuarios.</p>
                      )}
                    </>
                ) : (
                    <div className="flex items-center justify-center p-8">
                        <LoadingSpinner className="h-6 w-6 text-muted-foreground" />
                    </div>
                )
              }
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
