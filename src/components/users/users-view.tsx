
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Pencil, Mail, User, Search, Download, FileSpreadsheet } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';

import { EditUserDialog } from './edit-user-dialog';
import { ImportExcelDialog } from './import-excel-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '../ui/card';
import { deleteUserAction, updateUserAction } from '@/lib/actions/users';


import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { updateSettingsAction } from '@/lib/actions/settings';
import { useServerAction } from '@/hooks/use-server-action';

import { Badge } from '../ui/badge';

interface UsersViewProps {
  initialUsers: any[];
  role: any;
  allowRegistration: boolean;
}

export function UsersView({ initialUsers, role, allowRegistration: initialAllowRegistration }: UsersViewProps) {
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  
  const [selectedUser, setSelectedUser] = useState<any | null>(null);



  
  const { toast } = useToast();
  const router = useRouter();

  const filteredAndSortedUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return initialUsers;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return initialUsers.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.dni.toLowerCase().includes(searchLower) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
    );
  }, [initialUsers, searchTerm]);
  
  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };
  
  const handleDelete = (user: any) => {
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const { execute: executeDeleteUser, isPending: isDeleting } = useServerAction(
    deleteUserAction,
    {
      successMessage: (data, params) => `El usuario "${selectedUser?.name}" ha sido eliminado.`,
      onSuccess: () => {
        setIsDeleteConfirmOpen(false);
        setSelectedUser(null);
        router.refresh();
      }
    }
  );

  const handleConfirmDelete = () => {
    if (!selectedUser) return;
    executeDeleteUser(selectedUser.id);
  };
  
  const [allowRegistration, setAllowRegistration] = useState(initialAllowRegistration);
  
  const { execute: executeUpdateSettings } = useServerAction(
    updateSettingsAction,
    {
      successMessage: 'Configuración actualizada correctamente'
    }
  );

  const handleToggle = (checked: boolean) => {
    setAllowRegistration(checked);
    executeUpdateSettings({ allow_registration: checked });
  };

  const handleExport = () => {
    // Crear CSV con los datos de los usuarios
    const csvHeaders = ['Nombre', 'DNI', 'Email', 'Rol'];
    const csvData = filteredAndSortedUsers.map(user => [
      user.name,
      user.dni,
      user.email || '',
      user.role
    ]);
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${role.toLowerCase()}s_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Exportación exitosa',
      description: `Se ha descargado la lista de ${role.toLowerCase()}s.`
    });
  };

  return (
    <>
      <CardContent>
        {/* Header con búsqueda y acciones */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`Buscar ${role.toLowerCase()}s por nombre, DNI o email...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportExcelOpen(true)}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Importar Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={filteredAndSortedUsers.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
        
        {/* Mostrar contador de resultados */}
        {searchTerm && (
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredAndSortedUsers.length === 0 
              ? `No se encontraron ${role.toLowerCase()}s que coincidan con "${searchTerm}"`
              : `Mostrando ${filteredAndSortedUsers.length} de ${initialUsers.length} ${role.toLowerCase()}s`
            }
          </div>
        )}
          
          <div className="space-y-4">
            {initialUsers.length > 0 ? filteredAndSortedUsers.map((user, index) => (
              <Card 
                key={user.id} 
                className="group overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-200 hover:border-l-blue-600"
              >
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                                <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">{user.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                    <span>DNI: {user.dni}</span>
                                    {user.email && (
                                        <div className="flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} className="hover:bg-blue-50">
                                <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(user)} className="hover:bg-red-50">
                                <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="border-dashed border-2 border-muted-foreground/25">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <h3 className="font-semibold text-lg mb-2">
                        No hay {role.toLowerCase()}s registrados
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Usa el botón "Añadir {role}" en la parte superior para comenzar.
                      </p>
                  </CardContent>
              </Card>
            )}
          </div>

      </CardContent>

      
      {selectedUser && (
        <EditUserDialog 
          isOpen={isEditUserOpen} 
          setIsOpen={setIsEditUserOpen} 
          user={selectedUser} 
        />
      )}
      

      

      
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario 
                  <span className="font-bold"> &quot;{selectedUser?.name}&quot;</span>.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                  {isDeleting ? <LoadingSpinner size="sm" /> : <Trash2 className="mr-2 h-4 w-4"/>}
                  {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      <ImportExcelDialog
        open={isImportExcelOpen}
        onOpenChange={setIsImportExcelOpen}
        onImportComplete={() => {
          toast({
            title: 'Importación completada',
            description: 'Los usuarios han sido importados exitosamente',
          });
          // Usar setTimeout para evitar conflictos con el toast
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }}
      />
    </>
  );
}
