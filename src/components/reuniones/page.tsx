// src/app/(app)/reuniones/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { MeetingsList } from "@/components/reuniones/meetings-list";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function MeetingsSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    )
}

export default function ReunionesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Reuniones y Acuerdos</h1>
        <Button asChild>
          <Link href="/reuniones/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Reunión
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Historial de Reuniones</CardTitle>
            <CardDescription>Consulta las reuniones pasadas y el estado de sus acuerdos.</CardDescription>
        </CardHeader>
        <CardContent>
            <Suspense fallback={<MeetingsSkeleton />}>
                <MeetingsList />
            </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
