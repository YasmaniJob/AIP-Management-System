// src/app/(app)/configuracion/configuracion-client.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Library, GraduationCap, Clock, Shield, Plus, Palette } from "lucide-react";
import { AddAreasDialog } from "@/components/settings/add-areas-dialog";
import { AddHoursDialog } from "@/components/settings/add-hours-dialog";
import { AddGradeDialog } from "@/components/settings/add-grade-dialog";
import { AreasView } from "@/components/settings/areas-view";
import { GradesView } from "@/components/settings/grades-view";
import { HoursView } from "@/components/settings/hours-view";
import { UsersView } from "@/components/users/users-view";
import { SecuritySettings } from "@/components/settings/security-settings";
import { CustomizationSettings } from "@/components/settings/customization-settings";
import { UnifiedFilterTabs, useFilterTabs } from "@/components/shared/unified-filter-tabs";

interface ConfiguracionClientProps {
  areas: any[];
  gradesWithSections: any[];
  hours: any[];
  settings: any;
  adminUsers: any[];
}

const configTabs = [
  {
    value: "admins",
    label: "Administradores",
    icon: Users,
    color: "blue" as const
  },
  {
    value: "areas",
    label: "Áreas",
    icon: Library,
    color: "green" as const
  },
  {
    value: "grados",
    label: "Grados y Secciones",
    icon: GraduationCap,
    color: "purple" as const
  },
  {
    value: "horas",
    label: "Horas Pedagógicas",
    icon: Clock,
    color: "orange" as const
  },
  {
    value: "personalizacion",
    label: "Personalización",
    icon: Palette,
    color: "pink" as const
  },
  {
    value: "seguridad",
    label: "Seguridad",
    icon: Shield,
    color: "red" as const
  }
];

export function ConfiguracionClient({ areas, gradesWithSections, hours, settings, adminUsers }: ConfiguracionClientProps) {
  const { currentTab } = useFilterTabs('section', 'admins');
  const [isAddAreasDialogOpen, setIsAddAreasDialogOpen] = useState(false);
  const [isAddHoursDialogOpen, setIsAddHoursDialogOpen] = useState(false);
  const [isAddGradeDialogOpen, setIsAddGradeDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      <Tabs value={currentTab} className="space-y-6">
        <UnifiedFilterTabs tabs={configTabs} paramName="section" defaultTab="admins" />
        
        <TabsContent value="admins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Administradores
              </CardTitle>
              <CardDescription>
                Gestiona los usuarios administradores del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersView 
                initialUsers={adminUsers}
                role="Administrador"
                allowRegistration={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="areas" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Library className="h-5 w-5" />
                    Áreas Académicas
                  </CardTitle>
                  <CardDescription>
                    Gestiona las áreas académicas del sistema educativo.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddAreasDialogOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir Área
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AreasView initialAreas={areas} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grados" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Grados y Secciones
                  </CardTitle>
                  <CardDescription>
                    Gestiona los grados académicos y sus secciones correspondientes.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddGradeDialogOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir Grado
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <GradesView initialGrades={gradesWithSections} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horas" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horas Pedagógicas
                  </CardTitle>
                  <CardDescription>
                    Gestiona los horarios y períodos de clases del sistema educativo.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddHoursDialogOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir Horas Pedagógicas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <HoursView initialHours={hours} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalizacion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Personalización
              </CardTitle>
              <CardDescription>
                Personaliza el nombre, logo y tema de la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomizationSettings initialSettings={settings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguridad" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuración de Seguridad
              </CardTitle>
              <CardDescription>
                Gestiona las configuraciones de seguridad del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecuritySettings initialSettings={settings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AddAreasDialog 
        isOpen={isAddAreasDialogOpen} 
        setIsOpen={setIsAddAreasDialogOpen} 
      />
      <AddHoursDialog 
         isOpen={isAddHoursDialogOpen} 
         setIsOpen={setIsAddHoursDialogOpen} 
       />
       <AddGradeDialog 
         isOpen={isAddGradeDialogOpen} 
         setIsOpen={setIsAddGradeDialogOpen} 
       />
    </div>
  );
}