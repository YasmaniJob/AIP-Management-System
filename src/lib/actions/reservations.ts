// src/lib/actions/reservations.ts
'use server';

import { revalidatePath } from "next/cache";
import { createServerClient } from "../supabase/server";
import { z } from "zod";
import { bookingTypeSchema, idFieldSchema } from '../constants/shared-schemas';

const slotSchema = z.object({
  date: z.string(),
  hour_id: z.string(),
});

const bookingSchema = z.object({
    slots: z.array(slotSchema).min(1, 'Debes seleccionar al menos un horario.'),
    teacher_id: idFieldSchema,
    activity: z.string().min(3, 'La actividad debe tener al menos 3 caracteres.'),
    type: bookingTypeSchema,
    area: z.string().optional(),
    grade_id: z.string().optional(),
    section_id: z.string().optional(),
});

export async function createBookingAction(values: z.infer<typeof bookingSchema>) {
    const supabase = await createServerClient();
    const parsed = bookingSchema.safeParse(values);

    if (!parsed.success) {
        return { success: false, error: 'Datos de reserva inválidos.' };
    }

    const { slots, area, ...commonData } = parsed.data;

    let areaId = null;
    if (area) {
        const { data: areaData, error: areaError } = await supabase
            .from('areas')
            .select('id')
            .eq('name', area)
            .single();

        if (areaError || !areaData) {
            return { success: false, error: 'El área curricular seleccionada no es válida.' };
        }
        areaId = areaData.id;
    }

    const bookingsToInsert = slots.map(slot => ({
        ...commonData,
        date: slot.date,
        hour_id: slot.hour_id,
        area_id: areaId,
    }));


    const { error } = await supabase.from('bookings').insert(bookingsToInsert);

    if (error) {
        console.error("Error creating booking:", error);
        if (error.code === '23505') { // unique_violation on (date, hour_id)
            return { success: false, error: 'Uno o más de los horarios seleccionados ya están reservados.' };
        }
        return { success: false, error: 'No se pudo crear la reserva.' };
    }

    revalidatePath('/reservas');
    return { success: true };
}


const rescheduleSchema = z.object({
    bookingId: idFieldSchema,
    newDate: z.string().min(1, 'Debes seleccionar una nueva fecha.'),
    newHourId: z.string().min(1, 'Debes seleccionar una nueva hora.'),
});

export async function rescheduleBookingAction(values: z.infer<typeof rescheduleSchema>) {
    const supabase = await createServerClient();
    const parsed = rescheduleSchema.safeParse(values);

    if (!parsed.success) {
        return { success: false, error: 'Datos de reprogramación inválidos.' };
    }
    
    const { bookingId, newDate, newHourId } = parsed.data;

    const { error } = await supabase
        .from('bookings')
        .update({ date: newDate, hour_id: newHourId })
        .eq('id', bookingId);
    
    if (error) {
        console.error("Error rescheduling booking:", error);
         if (error.code === '23505') {
            return { success: false, error: 'El nuevo horario ya está reservado.' };
        }
        return { success: false, error: 'No se pudo reprogramar la reserva.' };
    }
    
    revalidatePath('/reservas');
    return { success: true };
}


export async function deleteBookingAction(id: string) {
    const supabase = await createServerClient();
    
    const { error } = await supabase.from('bookings').delete().eq('id', id);

    if (error) {
        console.error("Error deleting booking:", error);
        return { success: false, error: 'No se pudo cancelar la reserva.' };
    }
    
    revalidatePath('/reservas');
    return { success: true };
}

const attendanceSchema = z.object({
    bookingId: idFieldSchema,
    status: z.enum(['attended', 'not_attended']),
});

export async function markAttendanceAction(bookingId: string, status: 'attended' | 'not_attended') {
    const supabase = await createServerClient();
    
    const parsed = attendanceSchema.safeParse({ bookingId, status });
    
    if (!parsed.success) {
        return { success: false, error: 'Datos de asistencia inválidos.' };
    }
    
    const { error } = await supabase
        .from('bookings')
        .update({ attendance_status: status })
        .eq('id', bookingId);
    
    if (error) {
        console.error("Error marking attendance:", error);
        return { success: false, error: 'No se pudo marcar la asistencia.' };
    }
    
    revalidatePath('/reservas');
    return { success: true };
}
