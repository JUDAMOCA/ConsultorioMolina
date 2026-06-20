import { createServerSupabaseClient } from '@/lib/supabase-server'
import type {
  EarningsMonth,
  GalleryItem,
  PanelAppointment,
  PanelClinicInfo,
  PanelService,
} from './lib/types'

// Server-side reads for the dentist panel. All run with the authenticated
// (dentist) session so RLS applies; the page gate guarantees the caller is a
// dentist before these run. Nothing is fetched in the browser.

export async function getPanelAppointments(): Promise<PanelAppointment[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('appointments')
    .select('*, services(name, duration_minutes, price_cop), profiles(full_name, email, phone)')
    // Exclude online appointments that were never paid — they're orphans from a
    // failed/abandoned Wompi session and haven't been confirmed by the patient.
    // Cash appointments always show (paid in person), paid online appointments
    // show once confirmed, and cancelled ones are kept for the doctor's history.
    .or('payment_method.eq.cash,payment_status.eq.paid,status.eq.cancelled')
    .order('appointment_date')
    .order('start_time')
  return (data ?? []) as PanelAppointment[]
}

export async function getPanelServices(): Promise<PanelService[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('services').select('*').order('name')
  return (data ?? []) as PanelService[]
}

export async function getPanelGallery(): Promise<GalleryItem[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('gallery')
    .select('id, image_url, file_path')
    .order('created_at', { ascending: false })
  return (data ?? []) as GalleryItem[]
}

export async function getPanelClinicInfo(): Promise<PanelClinicInfo | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('clinic_info').select('*').limit(1).maybeSingle()
  return (data as PanelClinicInfo | null) ?? null
}

// Last 6 months of non-cancelled revenue, bucketed server-side (was computed in
// the browser before).
export async function getEarnings(): Promise<EarningsMonth[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('appointments')
    .select('appointment_date, services(price_cop)')
    .neq('status', 'cancelled')
  const list = (data ?? []) as Array<{
    appointment_date: string | null
    services: { price_cop: number } | { price_cop: number }[] | null
  }>

  const months: EarningsMonth[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = d.toISOString().slice(0, 7) // "2025-03"
    const label = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
    const matching = list.filter((a) => a.appointment_date?.startsWith(key))
    const total = matching.reduce((sum, a) => {
      const svc = Array.isArray(a.services) ? a.services[0] : a.services
      return sum + (svc?.price_cop ?? 0)
    }, 0)
    months.push({ month: key, label, total, count: matching.length })
  }
  return months
}
