// src/components/reservations/new-booking-view.tsx
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { WeeklyCalendar } from './weekly-calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChevronsUpDown, GraduationCap, Building, BookOpen, Grid3x3 } from 'lucide-react';
import { createBookingAction } from '@/lib/actions/reservations';
import { useServerAction } from '@/hooks/use-server-action';
import type { Area, GradeWithSections, PedagogicalHour, Booking, User } from '@/lib/types';
import { BookingSummary } from './booking-summary';
import { SelectUserDialog } from '../users/select-user-dialog';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { CalendarNav } from './calendar-nav';


const slotSchema = z.object({
  date: z.string(),
  hour_id: z.string(),
});

const bookingSchema = z.object({
    slots: z.array(slotSchema).min(1, 'Debes seleccionar al menos un horario.'),
    teacher_id: z.string().min(1, 'El docente es obligatorio.'),
    activity: z.string().min(3, 'La actividad debe tener al menos 3 caracteres.'),
    type: z.enum(['STUDENT', 'INSTITUTIONAL']),
    area: z.string().optional(),
    grade_id: z.string().optional(),
    section_id: z.string().optional(),
}).refine(data => {
    if (data.type === 'STUDENT') {
        return !!data.area && !!data.grade_id && !!data.section_id;
    }
    return true;
}, {
    message: 'Área, grado y sección son obligatorios para actividades con estudiantes.',
    path: ['area'],
});


interface NewBookingViewProps {
    areas: Area[];
    gradesWithSections: GradeWithSections[];
    hours: PedagogicalHour[];
    initialBookings: Booking[];
    users: User[];
    initialDate?: string;
    initialHourId?: string;
    userRole: string;
    userId: string;
}


export function NewBookingView({ areas, gradesWithSections, hours, initialBookings, users, initialDate, initialHourId, userRole, userId }: NewBookingViewProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date(initialDate ? initialDate.replace(/-/g, '/') : new Date()));
    
    const isTeacher = userRole === 'Docente';
    
    const form = useForm<z.infer<typeof bookingSchema>>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            slots: initialDate && initialHourId ? [{ date: initialDate, hour_id: initialHourId }] : [],
            teacher_id: isTeacher ? userId : '',
            activity: '',
            type: 'STUDENT',
        },
    });

    const handleSlotToggle = (date: string, hourId: string) => {
        const currentSlots = form.getValues('slots') || [];
        const slotIndex = currentSlots.findIndex(s => s.date === date && s.hour_id === hourId);

        if (slotIndex > -1) {
            const newSlots = [...currentSlots];
            newSlots.splice(slotIndex, 1);
            form.setValue('slots', newSlots);
        } else {
            form.setValue('slots', [...currentSlots, { date, hour_id: hourId }]);
        }
    };
    
    const selectedTeacherId = form.watch('teacher_id');
    const selectedUser = useMemo(() => selectedTeacherId ? users.find(p => p.id === selectedTeacherId) : null, [users, selectedTeacherId]);

    const selectedGradeId = form.watch('grade_id');
    const selectedGrade = gradesWithSections.find(g => g.id === selectedGradeId);

    const bookingType = form.watch('type');
    
    useEffect(() => {
      if (isTeacher) {
        form.setValue('teacher_id', userId);
      }
    }, [isTeacher, userId, form]);

    const { execute: executeCreateBooking, isPending } = useServerAction(
        createBookingAction,
        {
            successMessage: 'Reserva creada exitosamente',
            onSuccess: () => {
                form.reset();
                router.push('/reservas');
            }
        }
    );

    function onSubmit(values: z.infer<typeof bookingSchema>) {
        executeCreateBooking(values);
    }

    return (
        <>
            <Form {...form}>
                <form id="new-booking-form" onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        
                        <div className="space-y-6">
                             <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                            >
                                                <FormItem>
                                                    <FormControl>
                                                        <RadioGroupItem value="STUDENT" id="r-student" className="peer sr-only"/>
                                                    </FormControl>
                                                     <Label htmlFor="r-student" className={cn(
                                                         "flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent/50 cursor-pointer transition-colors",
                                                         "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                                                     )}>
                                                        <GraduationCap className="h-6 w-6" />
                                                        <span className="font-bold">Para Estudiantes</span>
                                                    </Label>
                                                </FormItem>
                                                <FormItem>
                                                    <FormControl>
                                                        <RadioGroupItem value="INSTITUTIONAL" id="r-institutional" className="peer sr-only"/>
                                                    </FormControl>
                                                    <Label htmlFor="r-institutional" className={cn(
                                                         "flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent/50 cursor-pointer transition-colors",
                                                         "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                                                     )}>
                                                        <Building className="h-6 w-6" />
                                                        <span className="font-bold">Uso Institucional</span>
                                                    </Label>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-6">
                                <h2 className="text-base font-semibold">1. Completa los Detalles</h2>
                                <FormField
                                    control={form.control}
                                    name="teacher_id"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Docente a cargo</FormLabel>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-between font-normal"
                                                onClick={() => setIsTeacherDialogOpen(true)}
                                                type="button"
                                                disabled={isTeacher}
                                            >
                                                {selectedUser ? selectedUser.name : 'Selecciona un usuario'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                
                                <FormField control={form.control} name="activity" render={({ field }) => ( <FormItem><FormLabel>Actividad a realizar</FormLabel><FormControl><Input {...field} placeholder="Ej: Sesión de aprendizaje sobre el sistema solar"/>
    </FormControl><FormMessage /></FormItem> )} />
                                
                                {bookingType === 'STUDENT' && (
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                            <FormField control={form.control} name="area" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Área Curricular</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <div className="flex items-center gap-2">
                                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                                <SelectValue placeholder="Selecciona un área" />
                                                            </div>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {areas.map(area => (<SelectItem key={area.id} value={area.name}>{area.name}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="grade_id" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Grado</FormLabel>
                                                    <Select onValueChange={(value) => { field.onChange(value); form.setValue('section_id', ''); }} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <div className="flex items-center gap-2">
                                                                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                                                    <SelectValue placeholder="Grado" />
                                                                </div>
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {gradesWithSections.map(grade => (<SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="section_id" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sección</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGradeId}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <div className="flex items-center gap-2">
                                                                    <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                                                                    <SelectValue placeholder={!selectedGradeId ? "Elige un grado" : "Sección"} />
                                                                </div>
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {selectedGrade?.sections.map((section: any) => (<SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator/>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-base font-semibold">2. Selecciona los Horarios</h2>
                                <p className="text-muted-foreground text-sm">Haz clic en los espacios libres del calendario para seleccionarlos.</p>
                            </div>
                             <CalendarNav
                                initialDate={initialDate || new Date().toISOString()}
                                onDateChange={(newDate) => setViewDate(newDate)}
                             />
                            <WeeklyCalendar 
                                hours={hours}
                                initialBookings={initialBookings}
                                onSlotSelect={handleSlotToggle}
                                selectedSlots={form.watch('slots')}
                                viewDate={viewDate}
                            />
                            <FormField control={form.control} name="slots" render={() => ( <FormItem className="hidden"><FormMessage /></FormItem> )} />
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                        <BookingSummary 
                            form={form}
                            hours={hours}
                            users={users}
                            areas={areas}
                            gradesWithSections={gradesWithSections}
                            isSubmitting={isPending}
                            onRemoveSlot={handleSlotToggle}
                        />
                        </div>
                    </div>
                </form>
            </Form>
            <SelectUserDialog
                isOpen={isTeacherDialogOpen}
                setIsOpen={setIsTeacherDialogOpen}
                onSelectUser={(user) => {
                    form.setValue('teacher_id', user.id);
                    setIsTeacherDialogOpen(false);
                }}
                users={users}
            />
        </>
    );
}
