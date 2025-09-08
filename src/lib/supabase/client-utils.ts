import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

export const getSupabaseClient = () => {
  return createClientComponentClient<Database>();
};

export type Tables = Database['public']['Tables'];
exort type TableName = keyof Tables;

export async function insertRecord<T extends TableName>(
  table: T,
  data: Omit<Tables[T]['Insert'], 'id' | 'created_at' | 'updated_at'>
) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from(table)
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateRecord<T extends TableName>(
  table: T,
  id: string,
  data: Partial<Tables[T]['Update']>
) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from(table)
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteRecord<T extends TableName>(table: T, id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}
