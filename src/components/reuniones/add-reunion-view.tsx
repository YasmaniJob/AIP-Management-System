// src/components/reuniones/add-reunion-view.tsx
'use client';
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { PlusCircle, Trash2, UserCog, User, Users, Hand, MoreHorizontal, Briefcase } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ReunionSummary } from './reunion-summary';
import { createMeetingAction } from '@/lib/actions/meetings';
import { useServerAction } from '@/hooks/use-server-action';
import type { Area, User as UserType } from '@/lib/types';
import { roleColorMap } from '@/lib/constants';
import React from 'react';

const participantGroups = [
    { id: "Director(a)", label: "Director(a)", icon: Briefcase },
    { id: "Sub-Director(a)", label: "Sub-Director(a)", icon: UserCog },
    { id: "Coordinadores", label: "Coordinadores", icon: Users },
    { id: "Docentes", label: "Docentes", icon: User },
    { id: "Auxiliares", label: "Auxiliares", icon: Hand },
    { id: "Otros", label: "Otros", icon: MoreHorizontal }
] as const;

const taskSchema = z.object({
    title: z.string().min(1, 'El acuerdo es requerido.'),
    responsible_id: z.string().min(1, 'El responsable es requerido.'),
    notes: z.string().optional(),
});

const meetingSchema = z.object({
    title: z.string().min(1, 'El título de la reunión es requerido.'),
    participant_groups: z.array(z.string()).min(1, 'Debe seleccionar al menos un grupo de participantes.'),
    docente_areas: z.array(z.string()).optional(),
    other_participants: z.string().optional(),
    tasks: z.array(taskSchema).optional(),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

interface AddReunionViewProps {
    areas: Area[];
    admins: UserType[];
}

export function AddReunionView({ areas, admins }: AddReunionViewProps) {
    const router = useRouter();
    const { toast } = useToast();
    
    const form = useForm<MeetingFormValues>({
        resolver: zodResolver(meetingSchema),
        defaultValues: {
            title: '',
            participant_groups: [],
            docente_areas: [],
            other_participants: '',
            tasks: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "tasks",
    });

    const participants = form.watch('participant_groups');
    const showOtherParticipants = participants.includes('Otros');
    const showDocenteAreas = participants.includes('Docentes');
    
    const { execute: executeCreateMeeting, isPending } = useServerAction(
        createMeetingAction,
        {
            successMessage: 'Reunión creada exitosamente',
            onSuccess: () => {
                form.reset();
                router.push('/reuniones');
            }
        }
    );

    const onSubmit = (values: MeetingFormValues) => {
        executeCreateMeeting(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información General</CardTitle>
                            <CardDescription>Define el tema y los participantes de la reunión.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Tema / Título de la Reunión</FormLabel><FormControl><Input {...field} placeholder="Ej: Planificación de Aniversario"/></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="participant_groups" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Participantes</FormLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {participantGroups.map(p => {
                                            const isSelected = field.value?.includes(p.id);
                                            const color = roleColorMap[p.id as keyof typeof roleColorMap];
                                            return (
                                                <Button 
                                                    key={p.id} 
                                                    type="button" 
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    onClick={() => {
                                                        const current = field.value || [];
                                                        const updated = current.includes(p.id) ? current.filter(item => item !== p.id) : [...current, p.id];
                                                        field.onChange(updated);
                                                    }}
                                                    style={isSelected ? { backgroundColor: color, borderColor: color } : {}}
                                                >
                                                    <p.icon className="mr-2 h-4 w-4" />
                                                    {p.label}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                    <FormMessage/>
                                </FormItem>
                            )} />
                            {showOtherParticipants && (
                                <FormField control={form.control} name="other_participants" render={({ field }) => (
                                    <FormItem><FormLabel>Especificar "Otros"</FormLabel><FormControl><Textarea {...field} placeholder="Ej: Padres de Familia, etc."/></FormControl><FormMessage /></FormItem>
                                )} />
                            )}
                            {showDocenteAreas && (
                                <FormField control={form.control} name="docente_areas" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Áreas de Trabajo Colegiado</FormLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {areas.map(area => (
                                             <Button key={area.id} type="button" variant={field.value?.includes(area.name) ? 'default' : 'outline'} onClick={() => {
                                                const current = field.value || [];
                                                const updated = current.includes(area.name) ? current.filter(item => item !== area.name) : [...current, area.name];
                                                field.onChange(updated);
                                            }}>{area.name}</Button>
                                        ))}
                                    </div>
                                    <FormMessage/>
                                </FormItem>
                            )} />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Acuerdos y Tareas (Opcional)</CardTitle>
                            <CardDescription>Añade las tareas o acuerdos que surgieron. Cada tarea debe tener un responsable.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-lg space-y-4 bg-muted/50">
                                    <div className="flex justify-between items-start gap-4">
                                        <FormField control={form.control} name={`tasks.${index}.title`} render={({ field }) => (
                                            <FormItem className="flex-grow"><FormLabel>Acuerdo / Tarea {index + 1}</FormLabel><FormControl><Input {...field} placeholder="Descripción breve del acuerdo"/></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <div className="flex flex-col space-y-2">
                                            <FormLabel>&nbsp;</FormLabel>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                        <FormField control={form.control} name={`tasks.${index}.responsible_id`} render={({ field }) => (
                                            <FormItem><FormLabel>Responsable (Admin)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar Admin"/></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {admins.map(admin => <SelectItem key={admin.id} value={admin.id}>{admin.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name={`tasks.${index}.notes`} render={({ field }) => (
                                            <FormItem><FormLabel>Notas (Opcional)</FormLabel><FormControl><Input {...field} placeholder="Detalles adicionales"/></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </div>
                            ))}
                             <Button type="button" variant="outline" className="w-full" onClick={() => append({ title: '', responsible_id: admins.length === 1 ? admins[0].id : '', notes: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Tarea
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                       <ReunionSummary form={form} admins={admins} isSubmitting={isPending}/>
                    </div>
                </div>
            </form>
        </Form>
    );
}
