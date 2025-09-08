// src/components/users/profile-dialog.tsx
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription as CardDescriptionComponent, CardFooter, CardHeader, CardTitle as CardTitleComponent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogOut, User, Edit3, Settings, Mail, Calendar, Shield, UserCheck } from "lucide-react";
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { useState } from 'react';
import { logoutAction } from '@/lib/actions/auth';
import { useServerAction } from '@/hooks/use-server-action';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProfileDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: any;
}

export function ProfileDialog({ isOpen, setIsOpen, user }: ProfileDialogProps) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { execute: executeLogout } = useServerAction(
        logoutAction,
        {
            successMessage: 'Sesión cerrada correctamente',
            onSuccess: (result) => {
                if (result.data?.redirect) {
                    router.push(result.data.redirect);
                }
            }
        }
    );

    const handleLogout = () => {
        executeLogout();
    };

    const getRoleColor = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'administrador':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'docente':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'administrador':
                return <Shield className="h-3 w-3" />;
            case 'docente':
                return <UserCheck className="h-3 w-3" />;
            default:
                return <User className="h-3 w-3" />;
        }
    };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0">
            <DialogHeader className="sr-only">
                <DialogTitle>Perfil de Usuario</DialogTitle>
                <DialogDescription>
                    Gestiona tu perfil, configuraciones y sesión.
                </DialogDescription>
            </DialogHeader>
            <Card className="w-full shadow-none border-none">
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                         <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
                            <User className="h-10 w-10 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div>
                                <CardTitleComponent className="text-2xl font-bold">{user?.name || 'Usuario'}</CardTitleComponent>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={`${getRoleColor(user?.role)} flex items-center gap-1`}>
                                        {getRoleIcon(user?.role)}
                                        {user?.role || 'Rol no definido'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>{user?.email || 'Email no disponible'}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    {/* Información del usuario */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Información Personal</h4>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="display-name" className="text-sm font-medium">Nombre Completo</Label>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{user?.name || 'No especificado'}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="display-email" className="text-sm font-medium">Correo Electrónico</Label>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{user?.email || 'No especificado'}</span>
                                </div>
                            </div>
                            {user?.created_at && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Miembro desde</Label>
                                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {new Date(user.created_at).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Acciones rápidas */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Acciones</h4>
                        <div className="grid grid-cols-1 gap-2">
                            <Button variant="outline" className="justify-start" asChild>
                                <Link href="/configuracion" onClick={() => setIsOpen(false)}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configuración
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
                
                <CardFooter className="flex flex-col gap-2 border-t pt-6">
                    <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={handleLogout} 
                        disabled={isLoggingOut}
                        size="lg"
                    >
                        {isLoggingOut ? (
                            <>
                                <LoadingSpinner className="mr-2 h-4 w-4" />
                                Cerrando sesión...
                            </>
                        ) : (
                            <>
                                <LogOut className="mr-2 h-4 w-4" />
                                Cerrar Sesión
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                        ¿Necesitas ayuda? Contacta al administrador
                    </p>
                </CardFooter>
            </Card>
      </DialogContent>
    </Dialog>
  );
}