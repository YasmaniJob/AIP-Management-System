'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateCustomizationAction } from '@/lib/actions/settings';
import { useServerAction } from '@/hooks/use-server-action';
import { useConfig } from '@/contexts/config-context';
import type { Database } from '@/lib/supabase/database.types';
import { Palette, Upload, Type, Flame } from 'lucide-react';

type SystemSettings = Database['public']['Tables']['system_settings']['Row'];

const customizationSchema = z.object({
  app_name: z.string().min(1, 'El nombre de la aplicación es requerido.'),
  app_logo_url: z.string().nullable(),
  primary_color: z.string().min(1, 'El color primario es requerido.'),
  accent_color: z.string().min(1, 'El color de acento es requerido.'),
  theme_preset: z.string().min(1, 'El preset de tema es requerido.'),
});

type CustomizationFormData = z.infer<typeof customizationSchema>;

interface CustomizationSettingsProps {
  initialSettings: SystemSettings | null;
}

const themePresets = [
  { value: 'default', label: 'Por Defecto', primary: '#10b981', accent: '#3b82f6' },
  { value: 'blue', label: 'Azul Profesional', primary: '#2563eb', accent: '#0ea5e9' },
  { value: 'purple', label: 'Púrpura Moderno', primary: '#7c3aed', accent: '#a855f7' },
  { value: 'orange', label: 'Naranja Energético', primary: '#ea580c', accent: '#f59e0b' },
  { value: 'red', label: 'Rojo Dinámico', primary: '#dc2626', accent: '#ef4444' },
  { value: 'green', label: 'Verde Natural', primary: '#059669', accent: '#10b981' },
  { value: 'custom', label: 'Personalizado', primary: '', accent: '' },
];

export function CustomizationSettings({ initialSettings }: CustomizationSettingsProps) {
  const { toast } = useToast();
  const { refreshSettings } = useConfig();

  const [selectedPreset, setSelectedPreset] = useState(
    initialSettings?.theme_preset || 'default'
  );

  const form = useForm<CustomizationFormData>({
    resolver: zodResolver(customizationSchema),
    defaultValues: {
      app_name: initialSettings?.app_name || 'AIP Manager',
      app_logo_url: initialSettings?.app_logo_url || '',
      primary_color: initialSettings?.primary_color || '#10b981',
      accent_color: initialSettings?.accent_color || '#3b82f6',
      theme_preset: initialSettings?.theme_preset || 'default',
    },
  });

  const { execute: executeUpdate, isPending } = useServerAction(
    updateCustomizationAction,
    {
      onSuccess: async () => {
        await refreshSettings();
      },
      successMessage: 'Configuración guardada correctamente',
      errorMessage: 'No se pudieron guardar los cambios'
    }
  );

  const onSubmit = (data: CustomizationFormData) => {
    executeUpdate(data);
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    form.setValue('theme_preset', preset);
    
    const presetData = themePresets.find(p => p.value === preset);
    if (presetData && preset !== 'custom') {
      form.setValue('primary_color', presetData.primary);
      form.setValue('accent_color', presetData.accent);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Información General
              </CardTitle>
              <CardDescription>
                Configura el nombre y logo de la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="app_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Aplicación</FormLabel>
                    <FormControl>
                      <Input placeholder="AIP Manager" {...field} />
                    </FormControl>
                    <FormDescription>
                      Este nombre aparecerá en la barra de navegación y en el título de la aplicación.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="app_logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del Logo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://ejemplo.com/logo.png" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      URL de la imagen del logo. Si está vacío, se usará el icono por defecto.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Vista previa del logo */}
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {form.watch('app_logo_url') ? (
                    <img 
                      src={form.watch('app_logo_url') || ''} 
                      alt="Logo preview" 
                      className="h-8 w-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Flame className="h-8 w-8 text-primary" />
                  )}
                  <span className="font-semibold">{form.watch('app_name')}</span>
                </div>
                <span className="text-sm text-muted-foreground">Vista previa</span>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Tema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Tema y Colores
              </CardTitle>
              <CardDescription>
                Personaliza los colores y el tema de la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="theme_preset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preset de Tema</FormLabel>
                    <Select onValueChange={handlePresetChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un preset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {themePresets.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            <div className="flex items-center gap-2">
                              {preset.value !== 'custom' && (
                                <div className="flex gap-1">
                                  <div 
                                    className="w-3 h-3 rounded-full border" 
                                    style={{ backgroundColor: preset.primary }}
                                  />
                                  <div 
                                    className="w-3 h-3 rounded-full border" 
                                    style={{ backgroundColor: preset.accent }}
                                  />
                                </div>
                              )}
                              {preset.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecciona un preset predefinido o elige "Personalizado" para configurar colores manualmente.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedPreset === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="primary_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Primario</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" {...field} className="w-16 h-10 p-1" />
                            <Input {...field} placeholder="#10b981" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Color principal de la aplicación.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accent_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color de Acento</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" {...field} className="w-16 h-10 p-1" />
                            <Input {...field} placeholder="#3b82f6" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Color secundario para acentos y detalles.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Vista previa de colores */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: form.watch('primary_color') }}
                    />
                    <span className="text-sm">Primario</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: form.watch('accent_color') }}
                    />
                    <span className="text-sm">Acento</span>
                  </div>
                  <span className="text-sm text-muted-foreground ml-auto">Vista previa de colores</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}