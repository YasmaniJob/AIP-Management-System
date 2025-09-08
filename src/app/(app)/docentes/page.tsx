// src/app/(app)/docentes/page.tsx
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { DocentesView } from "@/components/users/docentes-view";

export default function DocentesPage() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Lista de Docentes</CardTitle>
                <CardDescription>Añade, importa y administra a los docentes de la institución.</CardDescription>
            </CardHeader>
            <Suspense fallback={<TableSkeleton />}>
                <DocentesView />
            </Suspense>
        </Card>
    </div>
  );
}
