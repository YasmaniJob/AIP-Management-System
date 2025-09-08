import { cleanupOrphanedUsers, verifyCurrentUser } from '@/lib/actions/cleanup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Users, Database } from 'lucide-react';
import { colors } from '@/lib/colors';
import { cn } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export default async function CleanupPage() {
  // Verificar que el usuario actual sea administrador
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  if (!userId) {
    redirect('/');
  }
  
  const supabase = await createServerClient();
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (!user || user.role !== 'Administrador') {
    redirect('/dashboard');
  }
  
  // Verificar el estado del usuario actual
  const userVerification = await verifyCurrentUser();
  
  async function handleCleanup() {
    'use server';
    const result = await cleanupOrphanedUsers();
    // Cleanup result
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Database className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Limpieza de Base de Datos</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Estado del Usuario Actual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {userVerification.exists ? (
                <CheckCircle className={cn("h-5 w-5", colors.success.icon)} />
              ) : (
                <AlertTriangle className={cn("h-5 w-5", colors.error.icon)} />
              )}
              <span>Estado del Usuario Actual</span>
            </CardTitle>
            <CardDescription>
              Verificación del usuario en sesión
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userVerification.exists ? (
              <div className="space-y-2">
                <p className={cn("text-sm", colors.success.text)}>✓ Usuario válido en base de datos</p>
                <div className={cn("text-xs", colors.neutral.textMuted)}>
                  <p>ID: {userVerification.user?.id}</p>
                  <p>Email: {userVerification.user?.email}</p>
                  <p>Nombre: {userVerification.user?.name}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className={cn("text-sm", colors.error.text)}>✗ Problema detectado</p>
                <p className={cn("text-xs", colors.neutral.textMuted)}>
                  Razón: {userVerification.reason}
                </p>
                {userVerification.userId && (
                  <p className={cn("text-xs", colors.neutral.textMuted)}>
                    User ID: {userVerification.userId}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Limpieza de Usuarios Huérfanos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Usuarios Huérfanos</span>
            </CardTitle>
            <CardDescription>
              Eliminar usuarios de auth sin correspondencia en la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleCleanup}>
              <Button type="submit" variant="destructive" className="w-full">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Ejecutar Limpieza
              </Button>
            </form>
            <p className={cn("text-xs mt-2", colors.neutral.textMuted)}>
              Esta acción eliminará usuarios de Supabase Auth que no tengan 
              correspondencia en la tabla users de la base de datos.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Información del Error</CardTitle>
          <CardDescription>
            Detalles sobre el error PGRST116 que se está experimentando
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Error:</strong> PGRST116 - Cannot coerce the result to a single JSON object</p>
            <p><strong>Causa:</strong> El usuario tiene una cookie válida pero no existe en la tabla users</p>
            <p><strong>Solución:</strong> Limpiar usuarios huérfanos o sincronizar las tablas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}