import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email es requerido' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const userIdCookie = cookieStore.get('user_id')?.value;

    if (!userIdCookie) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();

    // Verificar que el usuario existe
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userIdCookie)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el email no esté en uso por otro usuario
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', userIdCookie)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Este email ya está en uso por otro usuario' },
        { status: 400 }
      );
    }

    // Actualizar el email en la base de datos
    const { error: updateError } = await supabase
      .from('users')
      .update({ email })
      .eq('id', userIdCookie);

    if (updateError) {
      console.error('Error updating user email:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el email' },
        { status: 500 }
      );
    }

    // Actualizar el email en Supabase Auth si es necesario
    try {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        userIdCookie,
        { email }
      );

      if (authUpdateError) {
        console.warn('Warning: Could not update auth email:', authUpdateError);
        // No fallar si no se puede actualizar en auth, ya que el usuario puede haber sido creado sin auth
      }
    } catch (authError) {
      console.warn('Warning: Auth update failed:', authError);
      // Continuar sin fallar
    }

    return NextResponse.json({
      success: true,
      message: 'Email actualizado correctamente'
    });

  } catch (error) {
    console.error('Error in update-email API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}