
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
import { updateUserAction } from '@/lib/actions/users';
import { useServerAction } from '@/hooks/use-server-action';
import { USER_ROLES } from '@/lib/types';

interface EditUserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: any;
}

const userRoleTuple = z.enum(USER_ROLES);

const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos.'),
  email: z.string().email('Debe ser un email válido.'),
  role: userRoleTuple,
});


export function EditUserDialog({ isOpen, setIsOpen, user }: EditUserDialogProps) {
  const router = useRouter();
  const { toast } = useToast();


  const form = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      id: user.id,
      name: user.name,
      email: user.email || '',
      dni: user.dni,
      role: user.role,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        id: user.id,
        name: user.name,
        email: user.email || '',
        dni: user.dni,
        role: user.role,
      });
    }
  }, [isOpen, user, form]);

  const { execute: executeUpdateUser, isPending } = useServerAction(
    updateUserAction,
    {
      successMessage: (data) => `El usuario "${data.name}" ha sido actualizado.`,
      onSuccess: () => {
        setIsOpen(false);
        router.refresh();
      }
    }
  );

  const onSubmit = (values: z.infer<typeof updateUserSchema>) => {
    executeUpdateUser(values);
  };

  const currentRole = form.watch('role');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar {user.role}</DialogTitle>
           <DialogDescription>
            Actualiza los detalles del usuario.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="dni" render={({ field }) => (<FormItem><FormLabel>DNI</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
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
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
