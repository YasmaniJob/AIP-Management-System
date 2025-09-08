// RESPALDO DEL COMPONENTE REGISTER-FORM ORIGINAL
// Fecha: $(date)
// Motivo: Recreación completa del formulario de registro

// src/components/auth/register-form.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Flame, Loader2, User, Mail, KeyRound, Eye, EyeOff, Lock } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '../ui/form';
import { useState } from 'react';
import { registerAction } from '@/lib/actions/auth';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('El email es inválido.'),
  dni: z.string().length(8, 'El DNI debe tener 8 caracteres.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});


export function RegisterForm() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: '', email: '', dni: '', password: '', confirmPassword: '' },
    });
    
    const { isSubmitting } = form.formState;

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        const result = await registerAction(values);
        if (result?.error) {
            toast({
                variant: 'destructive',
                title: 'Error en el registro',
                description: result.error,
            });
        } else {
            toast({
                title: '¡Registro Exitoso!',
                description: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
            });
            router.push('/');
        }
    }
    
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <Flame className="w-8 h-8 text-primary" />
                    <h1 className="text-2xl font-bold font-headline">AIP Manager</h1>
                </div>
                <CardTitle className="text-xl">Crear Cuenta</CardTitle>
                <CardDescription>
                   Bienvenido. Completa tus datos para crear una cuenta de docente.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                         <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Completo</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Tu nombre y apellido" {...field} className="pl-9" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="email" placeholder="tu.email@ejemplo.com" {...field} className="pl-9" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="dni"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>DNI</FormLabel>
                                    <FormControl>
                                         <div className="relative">
                                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="text" placeholder="Tu número de DNI" {...field} className="pl-9" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                             <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} className="pl-9 pr-10" />
                                             <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                             </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmar Contraseña</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" {...field} className="pl-9 pr-10" />
                                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                             </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Crear mi cuenta'}
                        </Button>
                         <p className="text-xs text-center text-muted-foreground">
                           ¿Ya tienes una cuenta?{' '}
                            <Link href="/" className="underline font-semibold hover:text-primary">
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    </div>
  );
}