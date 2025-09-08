// src/components/auth/login-form.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '../ui/form';
import { useState, useEffect } from 'react';
import { useFormSubmission } from '@/hooks/use-async-state';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { loginAction } from '@/lib/actions/auth';
import { useServerAction } from '@/hooks/use-server-action';
import Link from 'next/link';
import type { Database } from '@/lib/supabase/database.types';
import Image from 'next/image';

type SystemSettings = Database['public']['Tables']['system_settings']['Row'];

const loginSchema = z.object({
  email: z.string().email('Debes ingresar un email válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

interface LoginFormProps {
  showRegistrationSuccess?: boolean;
  settings?: SystemSettings | null;
}

export function LoginForm({ showRegistrationSuccess, settings }: LoginFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { execute: executeLogin, isPending } = useServerAction(
        loginAction,
        {
            successMessage: 'Inicio de sesión exitoso',
            errorMessage: 'Error al iniciar sesión'
        }
    );
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    // Mostrar mensaje de registro exitoso
    useEffect(() => {
        if (showRegistrationSuccess) {
            toast({
                title: "¡Registro exitoso!",
                description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
                variant: "default"
            });
        }
    }, [showRegistrationSuccess, toast]);

    const onSubmit = (values: z.infer<typeof loginSchema>) => {
        executeLogin(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex items-center justify-center min-h-screen bg-muted/40">
                    <Card className="w-full max-w-sm">
                        <CardHeader className="text-center">
                            <div className="flex flex-col justify-center items-center gap-2 mb-4">
                                {settings?.app_logo_url ? (
                                    <Image 
                                        src={settings.app_logo_url} 
                                        alt="Logo" 
                                        width={48} 
                                        height={48} 
                                        className="w-12 h-12"
                                    />
                                ) : (
                                    <Flame className="w-8 h-8 text-primary" />
                                )}
                                <h1 className="text-2xl font-bold font-headline">{settings?.app_name || 'AIP Manager'}</h1>
                            </div>
                            <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
                            <CardDescription>
                                Docentes: usen su email y su DNI como contraseña.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type={showPassword ? 'text' : 'password'} placeholder="Tu contraseña o DNI" {...field} className="pl-9 pr-10" />
                                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button className="w-full" type="submit" variant="gradient" disabled={isPending}>
                                {isPending ? <LoadingSpinner size="sm" /> : 'Ingresar'}
                            </Button>
                             <p className="text-xs text-center text-muted-foreground">
                               ¿No tienes cuenta?{' '}
                                <Link href="/register" className="underline font-semibold hover:text-primary">
                                    Regístrate aquí
                                </Link>
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </Form>
    );
}