// src/lib/actions/loans.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '../supabase/server';
import { z } from 'zod';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import { getCurrentUser } from './auth';
import { createMaintenanceRecord } from './maintenance';

const loanSchema = z.object({
  teacherId: z.string().min(1, 'Debes seleccionar un docente.'),
  areaId: z.string().min(1, 'Debes seleccionar un área.'),
  gradeId: z.string().min(1, 'Debes seleccionar un grado.'),
  sectionId: z.string().min(1, 'Debes seleccionar una sección.'),
  resourceIds: z.array(z.string()).min(1, 'Debes seleccionar al menos un recurso.'),
  notes: z.string().optional(),
});

const requestLoanSchema = z.object({
  areaId: z.string().min(1, 'Debes seleccionar un área.'),
  gradeId: z.string().min(1, 'Debes seleccionar un grado.'),
  sectionId: z.string().min(1, 'Debes seleccionar una sección.'),
  resourceIds: z.array(z.string()).min(1, 'Debes seleccionar al menos un recurso.'),
  notes: z.string().optional(),
  teacherId: z.string().min(1, 'ID del docente requerido.'),
});

export async function createLoanAction(values: z.infer<typeof loanSchema>) {
    const supabase = await createServerClient();
    const user = await getCurrentUser();
    
    if (!user) {
        return { success: false, error: 'Usuario no autenticado.' };
    }

    const parsedData = loanSchema.safeParse(values);

    if (!parsedData.success) {
        return { success: false, error: 'Datos de formulario inválidos.' };
    }

    const { teacherId, areaId, gradeId, sectionId, resourceIds, notes } = parsedData.data;

    // Verificar si el usuario actual es un administrador
    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = userProfile?.role === 'Administrador';
    
    // Si es administrador, crear préstamo directamente activo y autorizado
    // Si no es administrador, crear como pendiente
    const loanStatus = isAdmin ? 'Activo' : 'Pendiente';
    const isAuthorized = isAdmin;

    try {
        // Use a transaction to ensure all or nothing
        const { data: loan, error: loanError } = await supabase.from('loans').insert({
            teacher_id: teacherId,
            area_id: areaId,
            grade_id: gradeId,
            section_id: sectionId,
            notes: notes,
            status: loanStatus,
            loan_date: new Date().toISOString(),
            return_date: null,
            is_authorized: isAuthorized,
        }).select().single();

        if (loanError) throw loanError;

        // Create entries in the loan_resources join table
        const loanResourcesToInsert = resourceIds.map(resourceId => ({
            loan_id: loan.id,
            resource_id: resourceId
        }));
        
        const { error: loanResourcesError } = await supabase
            .from('loan_resources')
            .insert(loanResourcesToInsert);

        if (loanResourcesError) throw loanResourcesError;

        // Si es administrador, marcar recursos como 'En Préstamo' inmediatamente
        if (isAdmin) {
            const { error: resourceUpdateError } = await supabase
                .from('resources')
                .update({ status: 'En Préstamo' })
                .in('id', resourceIds);

            if (resourceUpdateError) throw resourceUpdateError;
        }

    } catch (error) {
        // Error creating loan
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al crear el préstamo'
        };
    }

    revalidatePath('/prestamos');
    revalidatePath('/inventario');
    
    const message = isAdmin 
        ? 'Préstamo creado y activado exitosamente.' 
        : 'Solicitud de préstamo creada exitosamente. Pendiente de autorización.';
    
    return { success: true, message };
}

const returnSchema = z.object({
  loanId: z.string(),
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos.'),
  damageReports: z.array(z.object({
    resourceId: z.string(),
    damages: z.array(z.string()),
    notes: z.string().optional(),
  })).optional(),
  suggestions: z.array(z.object({
    resourceId: z.string(),
    suggestions: z.array(z.string()),
    notes: z.string().optional(),
  })).optional(),
});


export async function returnLoanAction(values: z.infer<typeof returnSchema>) {
    console.log('returnLoanAction called with values:', values);
    const supabase = await createServerClient();
    const parsedData = returnSchema.safeParse(values);

    if (!parsedData.success) {
        console.error('Schema validation failed:', parsedData.error);
        return { success: false, error: 'Datos de formulario inválidos.' };
    }
    
    const { loanId, dni, damageReports = [], suggestions = [] } = parsedData.data;
    console.log('Parsed data:', { loanId, dni, damageReports, suggestions });

    // 1. Fetch loan and user to validate DNI
    const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select(`
            *,
            user:users(dni, name),
            grade:grades(name),
            section:sections(name)
        `)
        .eq('id', loanId)
        .single();
    
    // Prepare loan context for maintenance creation
    const loanContext = {
        teacherName: loan?.user?.name || 'Docente desconocido',
        teacherId: loan?.teacher_id || '',
        gradeId: loan?.grade_id || '',
        sectionId: loan?.section_id || '',
        gradeName: loan?.grade?.name || 'Grado desconocido',
        sectionName: loan?.section?.name || 'Sección desconocida'
    };
    
    if (loanError || !loan) {
        console.error('Loan not found:', loanError);
        return { success: false, error: 'Préstamo no encontrado.' };
    }
    
    console.log('Loan found:', { loanId: loan.id, userDni: loan.user?.dni, providedDni: dni });
    if (loan.user?.dni !== dni) {
        console.error('DNI mismatch:', { expected: loan.user?.dni, provided: dni });
        return { success: false, error: 'El DNI no coincide con el del usuario del préstamo.' };
    }
    console.log('DNI validation passed');
    
    const { data: allLoanResources, error: fetchAllResourcesError } = await supabase.from('loan_resources').select('resource_id').eq('loan_id', loanId);

    if (fetchAllResourcesError) {
        // Error fetching loan resources
        return { success: false, error: 'No se pudieron obtener los recursos del préstamo.' };
    }
    
    const allResourceIdsInLoan = allLoanResources.map(r => r.resource_id);
    const today = new Date();
    const returnTimestamp = today.toLocaleString('es-PE', { timeZone: 'America/Lima' });

    let finalNotes = `[${returnTimestamp}]\n`;
    let resourcesToUpdate: any = {};
    let hasAnyReport = false;
    let anyResourceDamaged = false;

    // Process all resources to build notes and status updates
    for (const resourceId of allResourceIdsInLoan) {
        const damages = damageReports.find(r => r.resourceId === resourceId);
        const suggs = suggestions.find(r => r.resourceId === resourceId);
        const isDamaged = damages && damages.damages.length > 0;
        
        // This will be the note for the resource itself.
        let resourceNoteForItself = `[${returnTimestamp}]\n`;
        let hasReportForThisResource = false;
        
        // This will be part of the note for the loan record.
        let reportForLoanNote = `[Recurso ID ${resourceId}]\n`;
        

        if (isDamaged || (damages && damages.notes)) {
            hasReportForThisResource = true;
            const damageText = `Daños: [${damages.damages.join(', ')}]` + (damages.notes ? ` | Notas: "${damages.notes}"\n` : '\n');
            resourceNoteForItself += damageText;
            reportForLoanNote += damageText;
        }
        if (suggs && (suggs.suggestions.length > 0 || suggs.notes)) {
            hasReportForThisResource = true;
            const suggestionText = `Sugerencias: [${suggs.suggestions.join(', ')}]` + (suggs.notes ? ` | Notas Adicionales: "${suggs.notes}"\n` : '\n');
            resourceNoteForItself += suggestionText;
            reportForLoanNote += suggestionText;
        }

        if (hasReportForThisResource) {
            hasAnyReport = true;
            finalNotes += reportForLoanNote;
        }
        
        if (isDamaged) {
            anyResourceDamaged = true;
        }

        resourcesToUpdate[resourceId] = {
            status: isDamaged ? 'Dañado' : 'Disponible',
            notes: hasReportForThisResource ? resourceNoteForItself.trim() : null,
        };
    }


    try {
        console.log('Updating loan with ID:', loanId, 'to status: Devuelto');
        const { error: updateLoanError } = await supabase
            .from('loans')
            .update({
                status: 'Devuelto',
                actual_return_date: today.toISOString(),
                notes: hasAnyReport ? finalNotes.trim() : null,
            })
            .eq('id', loanId);
        if (updateLoanError) {
            console.error('Error updating loan:', updateLoanError);
            throw updateLoanError;
        }
        console.log('Loan updated successfully to Devuelto status');

        // Batch update resource statuses and notes
        for (const resourceId in resourcesToUpdate) {
             const { error: updateResourceError } = await supabase
                .from('resources')
                .update({ 
                    status: resourcesToUpdate[resourceId].status,
                    notes: resourcesToUpdate[resourceId].notes,
                 })
                .eq('id', resourceId);

            if (updateResourceError) throw updateResourceError;

            // Si el recurso está dañado, crear automáticamente incidencias de mantenimiento individuales
            if (resourcesToUpdate[resourceId].status === 'Dañado') {
                const damageReport = damageReports.find(r => r.resourceId === resourceId);
                const suggestionReport = suggestions.find(r => r.resourceId === resourceId);
                
                if (damageReport && damageReport.damages.length > 0) {
                    console.log('Creating maintenance record for damaged resource:', resourceId);
                    try {
                        // Construir descripción combinando daños y sugerencias
                        let description = `Daños reportados: ${damageReport.damages.join(', ')}`;
                        if (damageReport.notes) {
                            description += `\n\nNotas del daño: ${damageReport.notes}`;
                        }
                        if (suggestionReport?.suggestions?.length) {
                            description += `\n\nSugerencias: ${suggestionReport.suggestions.join(', ')}`;
                            if (suggestionReport.notes) {
                                description += `\n\nNotas de sugerencias: ${suggestionReport.notes}`;
                            }
                        }
                        if (loanContext) {
                            description += `\n\nReportado por: ${loanContext.teacherName} (${loanContext.gradeName} - ${loanContext.sectionName})`;
                        }
                        
                        const maintenanceResult = await createMaintenanceRecord({
                            resourceId: resourceId,
                            maintenanceType: 'Correctivo',
                            incidentCategory: 'daño',
                            description: description
                        });
                        
                        if (!maintenanceResult.success) {
                            console.error('Failed to create maintenance record:', maintenanceResult.error);
                            throw new Error(`No se pudo crear el registro de mantenimiento para el recurso ${resourceId}`);
                        } else {
                            console.log('Maintenance record created successfully:', maintenanceResult);
                        }
                    } catch (error) {
                        console.error('Error in createMaintenanceRecord:', error);
                        throw error; // Re-throw to be caught by the outer try-catch
                    }
                }
            }
        }

    } catch (error) {
        // Error returning loan
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al devolver el préstamo'
        };
    }

    revalidatePath('/prestamos');
    revalidatePath('/inventario');
    return { success: true, message: 'Devolución registrada correctamente.' };
}

// Función auxiliar para verificar autenticación y rol de administrador
async function verifyAdminUser() {
    const supabase = await createServerClient();
    const user = await getCurrentUser();
    
    if (!user) {
        return { success: false, error: 'Usuario no autenticado.' };
    }

    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userProfile?.role !== 'Administrador') {
        return { success: false, error: 'Solo los administradores pueden realizar esta acción.' };
    }

    return { success: true, user, supabase };
}

// Función auxiliar para actualizar estado de recursos
async function updateResourcesStatus(supabase: any, resourceIds: string[], status: string) {
    if (resourceIds.length === 0) return { success: true };
    
    const { error } = await supabase
        .from('resources')
        .update({ status })
        .in('id', resourceIds);
    
    return error ? { success: false, error } : { success: true };
}

export async function authorizeLoanAction(loanId: string) {
    const authResult = await verifyAdminUser();
    if (!authResult.success) {
        return authResult;
    }
    
    const { supabase } = authResult;

    const { data: loan, error: fetchError } = await supabase
        .from('loans')
        .select('id, status, is_authorized')
        .eq('id', loanId)
        .single();
        
    if (fetchError || !loan) {
        return { success: false, error: 'Préstamo no encontrado.' };
    }

    if (loan.is_authorized) {
        return { success: false, error: 'Este préstamo ya ha sido autorizado.' };
    }

    const { error: updateError } = await supabase
        .from('loans')
        .update({ 
            is_authorized: true,
            status: 'Activo'
        })
        .eq('id', loanId);

    if (updateError) {
        // Error authorizing loan
        return {
            success: false,
            error: 'Error al autorizar el préstamo'
        };
    }

    revalidatePath('/prestamos');
    return { success: true };
}

export async function rejectLoanAction(loanId: string, reason?: string) {
    const authResult = await verifyAdminUser();
    if (!authResult.success) {
        return authResult;
    }
    
    const { supabase } = authResult;
    
    const { data: loan, error: fetchError } = await supabase
        .from('loans')
        .select('id, status, is_authorized, notes, loan_resources(resource_id)')
        .eq('id', loanId)
        .single();
        
    if (fetchError || !loan) {
        return { success: false, error: 'Préstamo no encontrado.' };
    }

    if (loan.is_authorized) {
        return { success: false, error: 'No se puede rechazar un préstamo ya autorizado.' };
    }

    try {
        // Get all resource IDs from the loan
        const resourceIds = loan.loan_resources.map((lr: any) => lr.resource_id);
        
        const rejectionNote = reason 
            ? `[SOLICITUD RECHAZADA] - ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })} - Motivo: ${reason}`
            : `[SOLICITUD RECHAZADA] - ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}`;
        
        // Update loan status to 'Rechazado'
        const { error: updateLoanError } = await supabase
            .from('loans')
            .update({ 
                status: 'Rechazado',
                is_authorized: false,
                actual_return_date: new Date().toISOString(),
                notes: loan.notes ? `${loan.notes}\n\n${rejectionNote}` : rejectionNote
            })
            .eq('id', loanId);

        if (updateLoanError) throw updateLoanError;

        // Si los recursos estaban marcados como 'En Préstamo', devolverlos a 'Disponible'
        if (resourceIds.length > 0) {
            // Primero verificar cuáles recursos están en préstamo
            const { data: resourcesInLoan } = await supabase
                .from('resources')
                .select('id')
                .in('id', resourceIds)
                .eq('status', 'En Préstamo');
            
            if (resourcesInLoan && resourcesInLoan.length > 0) {
                const resourcesToUpdate = resourcesInLoan.map(r => r.id);
                const resourceUpdateResult = await updateResourcesStatus(supabase, resourcesToUpdate, 'Disponible');
                
                if (!resourceUpdateResult.success) {
                    throw resourceUpdateResult.error;
                }
            }
        }

    } catch (error) {
        // Error rejecting loan
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al rechazar el préstamo'
        };
    }

    revalidatePath('/prestamos');
    revalidatePath('/inventario');
    return { success: true, message: 'Solicitud rechazada exitosamente.' };
}

export async function requestLoanAction(values: z.infer<typeof requestLoanSchema>) {
    const supabase = await createServerClient();
    const user = await getCurrentUser();
    
    if (!user) {
        return { success: false, error: 'Usuario no autenticado.' };
    }

    const parsedData = requestLoanSchema.safeParse(values);
    if (!parsedData.success) {
        return { success: false, error: 'Datos de formulario inválidos.' };
    }

    const { areaId, gradeId, sectionId, resourceIds, notes, teacherId } = parsedData.data;

    // Verificar que el usuario es un docente
    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userProfile?.role !== 'Docente') {
        return { success: false, error: 'Solo los docentes pueden solicitar préstamos.' };
    }

    try {
        // Crear la solicitud de préstamo con estado 'Pendiente'
        const { data: loanRequest, error: loanError } = await supabase
            .from('loans')
            .insert({
                teacher_id: teacherId,
                area_id: areaId,
                grade_id: gradeId,
                section_id: sectionId,
                notes: notes,
                status: 'Pendiente',
                loan_date: new Date().toISOString(),
                return_date: null,
                is_authorized: false,
            })
            .select()
            .single();

        if (loanError) {
            // Error creating loan request
            return { success: false, error: 'Error al crear la solicitud de préstamo.' };
        }

        // Asociar los recursos con la solicitud de préstamo
        const loanResources = resourceIds.map(resourceId => ({
            loan_id: loanRequest.id,
            resource_id: resourceId,
        }));

        const { error: resourcesError } = await supabase
            .from('loan_resources')
            .insert(loanResources);

        if (resourcesError) {
            // Error associating resources
            // Eliminar la solicitud de préstamo si falla la asociación de recursos
            await supabase.from('loans').delete().eq('id', loanRequest.id);
            return { success: false, error: 'Error al asociar recursos con la solicitud.' };
        }

        revalidatePath('/prestamos');
        return { success: true, message: 'Solicitud de préstamo enviada exitosamente.' };
    } catch (error) {
        // Error in requestLoanAction
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al procesar la solicitud'
        };
    }
}

export async function approveLoanAction(loanId: string) {
    const authResult = await verifyAdminUser();
    if (!authResult.success) {
        return authResult;
    }
    
    const { supabase } = authResult;

    try {
        // Obtener los recursos asociados al préstamo
        const { data: loanResources } = await supabase
            .from('loan_resources')
            .select('resource_id')
            .eq('loan_id', loanId);

        if (loanResources && loanResources.length > 0) {
            // Actualizar el estado de los recursos a 'En Préstamo'
            const resourceIds = loanResources.map(lr => lr.resource_id);
            const resourceUpdateResult = await updateResourcesStatus(supabase, resourceIds, 'En Préstamo');
            
            if (!resourceUpdateResult.success) {
                // Error updating resource status
                return { success: false, error: 'Error al actualizar el estado de los recursos.' };
            }
        }

        // Actualizar el estado del préstamo a 'Activo'
        const { error: updateError } = await supabase
            .from('loans')
            .update({
                status: 'Activo',
                is_authorized: true,
            })
            .eq('id', loanId)
            .eq('is_authorized', false); // Solo aprobar si no está autorizado

        if (updateError) {
            console.error('Error approving loan:', updateError);
            return { success: false, error: 'Error al aprobar el préstamo.' };
        }

        revalidatePath('/prestamos');
        revalidatePath('/inventario');
        return { success: true, message: 'Préstamo aprobado exitosamente.' };
    } catch (error) {
        console.error('Error in approveLoanAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al aprobar el préstamo'
        };
    }
}
