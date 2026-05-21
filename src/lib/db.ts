// src/lib/db.ts
'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Fetches a paginated list of records from a given table.
 * Automatically uses the active user's cookies for RLS validation.
 */
export async function fetchActiveRecords(
  table: string, 
  page = 1, 
  limit = 50, 
  selectQuery = '*' // Safely defaults to standard fetch
) {
  // Ensure you are using your server or client supabase instance correctly here
  const supabase = await createClient(); 

  const { data, error } = await supabase
    .from(table)
    .select(selectQuery) // Uses the dynamic query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    console.error(`Error fetching from ${table}:`, error.message);
    throw new Error(error.message);
  }

  return { data };
}

/**
 * Fetches a single record by its UUID.
 * Perfect for populating detail views or edit modals.
 */
export async function getRecordById(table: string, id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching record ${id} from ${table}:`, error.message);
    throw new Error(error.message);
  }

  return { data };
}

/**
 * Securely deletes a record if the user's RLS policies allow it.
 */
export async function deleteRecord(table: string, id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting record ${id} from ${table}:`, error.message);
    throw new Error(error.message);
  }

  return { success: true };
}