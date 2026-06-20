import { createClient } from '@supabase/supabase-js'
import { cacheLife, cacheTag } from 'next/cache'

// Public, read-only row shapes returned by the cached fetchers below.
// Client islands import these with `import type` so the module is never
// bundled into the client.
export interface Service {
  id: string
  name: string
  description?: string
  duration_minutes: number
  price_cop: number
}

export interface ClinicInfo {
  id?: string
  address: string
  phone: string
  email: string
  morning_start: string
  morning_end: string
  afternoon_start: string
  afternoon_end: string
  working_days: number[]
  clinic_name?: string
  logo_url?: string | null
  banner_subtitle?: string
  feature_1_title?: string
  feature_1_desc?: string
  feature_2_title?: string
  feature_2_desc?: string
  feature_3_title?: string
  feature_3_desc?: string
  banner_type?: 'gradient' | 'color' | 'slider'
  banner_color_from?: string
  banner_color_to?: string
  banner_images?: string[]
}

export interface GalleryImage {
  id: string
  image_url: string
}

// Cookieless anon client. Created inside each cached function so the client
// instance is never captured as a closure variable (which would become part
// of the cache key and break serialization).
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function getServices(activeOnly = false): Promise<Service[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('services')
  try {
    let query = publicClient().from('services').select('*')
    if (activeOnly) query = query.eq('is_active', true)
    const { data } = await query.order('name')
    return data ?? []
  } catch {
    return []
  }
}

export async function getClinicInfo(): Promise<ClinicInfo | null> {
  'use cache'
  cacheLife('hours')
  cacheTag('clinic-info')
  try {
    const { data } = await publicClient()
      .from('clinic_info')
      .select('*')
      .limit(1)
      .maybeSingle()
    return data ?? null
  } catch {
    return null
  }
}

export async function getGallery(): Promise<GalleryImage[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('gallery')
  try {
    const { data } = await publicClient()
      .from('gallery')
      .select('id, image_url')
      .order('created_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}
