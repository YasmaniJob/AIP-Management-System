// src/lib/actions/meetings.ts
'use server';

import { createServerClient } from "../supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { taskStatusSchema, idFieldSchema } from '../constants/shared-schemas';

const taskSchema = z.object({
    title: z.string().min(1, 'El acuerdo es requerido.'),
    responsible_id: z.string().min(1, 'El responsable es requerido.'),
    notes: z.string().optional(),
});

const meetingSchema = z.object({
    title: z.string().min(1, 'El título de la reunión es requerido.'),
    participant_groups: z.array(z.string()).min(1, 'Debe seleccionar al menos un grupo de participantes.'),
    other_participants: z.string().optional(),
    docente_areas: z.array(z.string()).optional(),
    tasks: z.array(taskSchema).optional(),
});

export async function createMeetingAction(values: z.infer<typeof meetingSchema>) {
    const supabase = await createServerClient();
    const parsedData = meetingSchema.safeParse(values);

    if (!parsedData.success) {
        const errorMessages = parsedData.error.errors.map(e => e.message).join(', ');
        return { success: false, error: `Datos inválidos: ${errorMessages}` };
    }

    const { title, participant_groups, other_participants, docente_areas, tasks } = parsedData.data;

    let combinedParticipantGroups: string[] = [];

    participant_groups.forEach(p => {
        if (p === 'Docentes' && docente_areas && docente_areas.length > 0) {
            combinedParticipantGroups.push(`Docentes (${docente_areas.join(', ')})`);
        } else if (p === 'Otros' && other_participants) {
            combinedParticipantGroups.push(`Otros: ${other_participants}`);
        } else if (p !== 'Otros' && p !== 'Docentes') {
            combinedParticipantGroups.push(p);
        }
    });
    
    if(participant_groups.includes('Docentes') && (!docente_areas || docente_areas.length === 0)) {
        combinedParticipantGroups.push('Docentes');
    }

    try {
        // Step 1: Insert the main meeting record
        const { data: meeting, error: meetingError } = await supabase.from('meetings').insert({
            title,
            date: new Date().toISOString(),
        }).select().single();

        if (meetingError) throw meetingError;

        // Step 2: Insert participant groups into the new table
        if (combinedParticipantGroups.length > 0) {
            const participantGroupsToInsert = combinedParticipantGroups.map(groupName => ({
                meeting_id: meeting.id,
                group_name: groupName,
            }));
            const { error: groupsError } = await supabase.from('meeting_participant_groups').insert(participantGroupsToInsert);
            if (groupsError) throw groupsError;
        }

        // Step 3: Insert tasks if they exist
        if (tasks && tasks.length > 0) {
            const tasksToInsert = tasks.map(task => ({
                ...task,
                meeting_id: meeting.id,
                status: 'Pendiente' as const,
            }));

            const { error: tasksError } = await supabase.from('meeting_tasks').insert(tasksToInsert);
            if (tasksError) throw tasksError;
        }

    } catch (error: any) {
        console.error("Error creating meeting:", error);
        return { success: false, error: `Error de base de datos: ${error.message}` };
    }

    revalidatePath('/reuniones');
    return { success: true, message: "Reunión guardada exitosamente." };
}


const updateTaskStatusSchema = z.object({
    taskId: idFieldSchema,
    status: taskStatusSchema,
});

export async function updateTaskStatusAction(values: z.infer<typeof updateTaskStatusSchema>) {
    const supabase = await createServerClient();
    const parsedData = updateTaskStatusSchema.safeParse(values);

    if (!parsedData.success) {
        return { success: false, error: 'Datos inválidos.' };
    }

    const { taskId, status } = parsedData.data;

    const { error } = await supabase
        .from('meeting_tasks')
        .update({ status })
        .eq('id', taskId);

    if (error) {
        console.error('Error updating task status:', error);
        return { success: false, error: 'No se pudo actualizar la tarea.' };
    }

    revalidatePath('/reuniones');
    return { success: true };
}
