import { createServerSupabaseClient } from '@/lib/supabase-server'

export interface PatientAppointment {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  payment_method: 'cash' | 'online'
  services: { name: string; duration_minutes: number; price_cop: number } | null
}

// Server-side read of the signed-in patient's appointments. RLS scopes the rows
// to this user; we also filter by patient_id explicitly.
export async function getMyAppointments(userId: string): Promise<PatientAppointment[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('appointments')
    .select('id, appointment_date, start_time, end_time, status, payment_method, services(name, duration_minutes, price_cop)')
    .eq('patient_id', userId)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })
  // PostgREST returns the to-one `services` relation as a single object, but
  // without generated DB types supabase-js infers it as an array — bridge it.
  return (data ?? []) as unknown as PatientAppointment[]
}
