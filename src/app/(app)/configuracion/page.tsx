// src/app/(app)/configuracion/page.tsx
import { Suspense } from "react";
import { getAreas, getGradesWithSections, getPedagogicalHours, getSystemSettings } from "@/lib/data/settings";
import { getUsers } from "@/lib/data/users";
import { ConfiguracionClient } from "./configuracion-client";



async function ConfiguracionData() {
  const [areas, gradesWithSections, hours, settings, adminUsers] = await Promise.all([
    getAreas(),
    getGradesWithSections(),
    getPedagogicalHours(),
    getSystemSettings(),
    getUsers({ role: 'Administrador' })
  ]);
  
  return (
    <ConfiguracionClient 
      areas={areas}
      gradesWithSections={gradesWithSections}
      hours={hours}
      settings={settings}
      adminUsers={adminUsers}
    />
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ConfiguracionData />
    </Suspense>
  );
}
