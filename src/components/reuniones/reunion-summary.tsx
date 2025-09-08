// src/components/reuniones/reunion-summary.tsx
'use client';
import type { UseFormReturn } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../ui/card";
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Check, Users, ClipboardList, User as UserIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface ReunionSummaryProps {
    form: UseFormReturn<any>;
    admins: any[];
    isSubmitting: boolean;
}

export function ReunionSummary({ form, admins, isSubmitting }: ReunionSummaryProps) {
    const { watch, formState } = form;
    const values = watch();
    const { title, participant_groups, other_participants, docente_areas, tasks } = values;

    const isFormComplete = title && participant_groups?.length > 0;
    const adminsMap = new Map(admins.map(admin => [admin.id, admin]));

    return (
        <TooltipProvider>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">{title || 'Nueva Reunión'}</CardTitle>
                    <CardDescription>Resumen de la información</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Separator />
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-semibold text-sm">Participantes</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {participant_groups?.length > 0 ? participant_groups.map((p: string) => {
                               let label = p;
                                if (p === 'Docentes' && docente_areas?.length > 0) {
                                    label = `Docentes (${docente_areas.join(', ')})`;
                                } else if (p === 'Otros' && other_participants) {
                                    label = `Otros: ${other_participants}`;
                                }
                               return <Badge key={p} variant="secondary">{label}</Badge>
                           }) : <p className="text-xs text-muted-foreground">No seleccionados</p>}
                        </div>
                    </div>
                     <Separator />
                    <div className="space-y-2">
                         <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-semibold text-sm">Acuerdos / Tareas ({tasks?.length || 0})</h4>
                        </div>
                        <div className="space-y-2">
                           {tasks?.length > 0 ? tasks.map((task: any, index: number) => {
                               const responsible = adminsMap.get(task.responsible_id);
                               return (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                    <p className="text-sm truncate pr-2">{task.title || "Acuerdo sin título"}</p>
                                    {responsible && (
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div className="h-6 w-6 rounded-full bg-background border flex items-center justify-center">
                                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{responsible.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                               )
                           }) : <p className="text-xs text-muted-foreground">Sin tareas añadidas</p>}
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={!isFormComplete || isSubmitting || !formState.isValid}>
                        {isSubmitting ? <LoadingSpinner className="mr-2 h-4 w-4"/> : <Check className="mr-2 h-4 w-4" />}
                        Guardar Reunión
                    </Button>
                </CardFooter>
            </Card>
        </TooltipProvider>
    );
}

    