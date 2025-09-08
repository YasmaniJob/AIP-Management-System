// src/components/reservations/booking-summary.tsx
'use client';
import type { UseFormReturn } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../ui/card";
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Check, Calendar, Clock, BookOpen, GraduationCap, Grid3x3, Building, User, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

interface BookingSummaryProps {
    form: UseFormReturn<any>;
    hours: any[];
    users: any[];
    areas: any[];
    gradesWithSections: any[];
    isSubmitting: boolean;
    onRemoveSlot: (date: string, hourId: string) => void;
}

export function BookingSummary({ form, hours, users, areas, gradesWithSections, isSubmitting, onRemoveSlot }: BookingSummaryProps) {
    const { watch } = form;
    const values = watch();
    const { slots, teacher_id, activity, type, area, grade_id, section_id } = values;

    const selectedTeacher = users.find(u => u.id === teacher_id);
    const selectedGrade = gradesWithSections.find(g => g.id === grade_id);
    const selectedSection = selectedGrade?.sections.find((s:any) => s.id === section_id);
    const selectedArea = areas.find(a => a.name === area);


    const isFormComplete = slots?.length > 0 && teacher_id && activity && (type === 'INSTITUTIONAL' || (area && grade_id && section_id));
    
    const groupedSlots = slots?.reduce((acc: any, slot: any) => {
        const date = slot.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(slot.hour_id);
        return acc;
    }, {});


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">{activity || 'Nueva Reserva'}</CardTitle>
                <CardDescription>Resumen de la reserva</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <Separator />
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <User className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                            <p className="font-medium">Docente:</p>
                            <p className="text-muted-foreground truncate">
                                {selectedTeacher?.name || 'No seleccionado'}
                            </p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <Building className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                             <p className="font-medium">Tipo:</p>
                             <p className="text-muted-foreground">
                                {type === 'STUDENT' ? 'Para Estudiantes' : 'Uso Institucional'}
                            </p>
                        </div>
                    </div>
                    {type === 'STUDENT' && (
                        <div className="pl-7 space-y-3 animate-in fade-in duration-300">
                            <div className="flex items-start gap-3">
                                <BookOpen className="h-4 w-4 mt-1 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Área:</p>
                                    <p className="text-muted-foreground">{selectedArea?.name || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <GraduationCap className="h-4 w-4 mt-1 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Grado:</p>
                                    <p className="text-muted-foreground">{selectedGrade?.name || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Grid3x3 className="h-4 w-4 mt-1 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Sección:</p>
                                    <p className="text-muted-foreground">{selectedSection?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <Separator />
                <div className="space-y-2">
                     <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                         <p className="font-medium">Horarios Seleccionados ({slots?.length || 0})</p>
                     </div>
                    <ScrollArea className="max-h-40">
                         <div className="pr-3 space-y-3">
                            {groupedSlots && Object.keys(groupedSlots).length > 0 ? (
                                Object.keys(groupedSlots).sort().map(date => (
                                    <div key={date}>
                                        <p className="font-semibold text-xs capitalize mb-1">{format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: es })}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {groupedSlots[date].sort((a: string, b: string) => {
                                                const hourA = hours.find(h => h.id === a)?.hour_order || 0;
                                                const hourB = hours.find(h => h.id === b)?.hour_order || 0;
                                                return hourA - hourB;
                                            }).map((hourId: string) => (
                                                <Badge key={hourId} variant="outline" className="pl-2 pr-1 py-0.5">
                                                    {hours.find(h => h.id === hourId)?.name}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 ml-1"
                                                        onClick={() => onRemoveSlot(date, hourId)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-xs text-center py-2">Ningún horario seleccionado.</p>
                            )}
                         </div>
                    </ScrollArea>
                </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={!isFormComplete || isSubmitting} form="new-booking-form">
                    {isSubmitting ? <LoadingSpinner size="sm" /> : <Check className="mr-2 h-4 w-4" />}
                    Confirmar Reserva
                </Button>
            </CardFooter>
        </Card>
    );
}