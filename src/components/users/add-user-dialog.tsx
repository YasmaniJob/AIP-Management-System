'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import React from 'react';
import { addUserAction } from '@/lib/actions/users';
import { useServerAction } from '@/hooks/use-server-action';
import { USER_ROLES } from '@/lib/types';

interface AddUserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  role: 'Docente' | 'Administrador';
}

const userRoleTuple = z.enum(USER_ROLES);

const addUserSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos.'),
  email: z.string().email('Debe ser un email válido.'),
  role: userRoleTuple,
  password: z.string().optional(),
}).refine(data => {
    if (data.role === 'Administrador') {
        return !!data.password && data.password.length >= 6;
    }
    return true;
}, {
    message: 'La contraseña debe tener al menos 6 caracteres.',
    path: ['password'],
});


export function AddUserDialog({ isOpen, setIsOpen, role }: AddUserDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { execute: executeAddUser, isPending: isSubmitting } = useServerAction(
    addUserAction,
    {
      successMessage: `${role} añadido exitosamente`,
      onSuccess: () => {
        form.reset();
        setIsOpen(false);
        router.refresh();
      }
    }
  );

  const form = useForm<z.infer<typeof addUserSchema>>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: '',
      email: '',
      dni: '',
      role: role,
      password: '',
    },
  });

  React.useEffect(() => {
    if(isOpen) {
      form.reset({
        name: '',
        email: '',
        dni: '',
        role: role,
        password: '',
      });
    }
  }, [isOpen, role, form]);


  const onSubmit = (values: z.infer<typeof addUserSchema>) => {
    executeAddUser(values);
  };
  
  const currentRole = form.watch('role');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo {role}</DialogTitle>
          <DialogDescription>
             {currentRole === 'Docente' 
                ? 'Completa los detalles. La contraseña inicial del docente será su DNI.' 
                : 'Completa los detalles del nuevo administrador.'
             }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="dni" render={({ field }) => (<FormItem><FormLabel>DNI</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            
            {currentRole === 'Administrador' && (
                <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
            )}
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormLabel>Rol</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {USER_ROLES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoadingSpinner size="sm" />}
                Añadir {role}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
