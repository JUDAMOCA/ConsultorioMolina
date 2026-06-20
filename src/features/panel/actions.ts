'use server'

import { revalidatePath, updateTag } from 'next/cache'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { PanelClinicInfo } from './lib/types'

type Result = { ok: true } | { error: string }
type UploadResult = { url: string } | { error: string }

const GALLERY_BUCKET = 'gallery'

// Every panel mutation re-checks that the caller is an authenticated dentist —
// server actions are public endpoints, so authorization can't rely on the page
// gate alone (vercel-react-best-practices: server-auth-actions).
async function dentistClient() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'dentist') return null
  return supabase
}

export async function updateAppointmentStatus(
  id: string,
  status: 'confirmed' | 'cancelled'
): Promise<Result> {
  const supabase = await dentistClient()
  if (!supabase) return { error: 'No autorizado.' }
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/panel')
  return { ok: true }
}

export async function saveService(input: {
  id?: string
  name: string
  durationMinutes: number
  priceCop: number
}): Promise<Result> {
  const supabase = await dentistClient()
  if (!supabase) return { error: 'No autorizado.' }
  if (!input.name || !input.durationMinutes || !input.priceCop) {
    return { error: 'Completa nombre, duración y precio.' }
  }
  const payload = {
    name: input.name,
    duration_minutes: input.durationMinutes,
    price_cop: input.priceCop,
    is_active: true,
  }
  const { error } = input.id
    ? await supabase.from('services').update(payload).eq('id', input.id)
    : await supabase.from('services').insert(payload)
  if (error) return { error: error.message }
  updateTag('services')
  revalidatePath('/panel')
  return { ok: true }
}

export async function deleteService(id: string): Promise<Result> {
  const supabase = await dentistClient()
  if (!supabase) return { error: 'No autorizado.' }
  const { error } = await supabase.from('services').update({ is_active: false }).eq('id', id)
  if (error) return { error: error.message }
  updateTag('services')
  revalidatePath('/panel')
  return { ok: true }
}

export async function saveClinicInfo(info: PanelClinicInfo): Promise<Result> {
  const supabase = await dentistClient()
  if (!supabase) return { error: 'No autorizado.' }
  const payload = {
    id: info.id,
    clinic_name: info.clinic_name,
    logo_url: info.logo_url,
    address: info.address,
    phone: info.phone,
    email: info.email,
    morning_start: info.morning_start,
    morning_end: info.morning_end,
    afternoon_start: info.afternoon_start,
    afternoon_end: info.afternoon_end,
    working_days: info.working_days ?? [1, 2, 3, 4, 5],
    feature_1_title: info.feature_1_title,
    feature_1_desc: info.feature_1_desc,
    feature_2_title: info.feature_2_title,
    feature_2_desc: info.feature_2_desc,
    feature_3_title: info.feature_3_title,
    feature_3_desc: info.feature_3_desc,
    banner_subtitle: info.banner_subtitle ?? '',
    banner_type: info.banner_type ?? 'gradient',
    banner_color_from: info.banner_color_from ?? '#0284c7',
    banner_color_to: info.banner_color_to ?? '#06b6d4',
    banner_images: info.banner_images ?? [],
  }
  const { error } = await supabase.from('clinic_info').upsert(payload, { onConflict: 'id' })
  if (error) return { error: error.message }
  updateTag('clinic-info')
  revalidatePath('/panel')
  return { ok: true }
}

// Partial upsert used to auto-persist banner changes without clobbering other
// in-progress (unsaved) edits in the form.
export async function saveBanner(clinicId: string, images: string[]): Promise<Result> {
  const supabase = await dentistClient()
  if (!supabase) return { error: 'No autorizado.' }
  const { error } = await supabase
    .from('clinic_info')
    .upsert({ id: clinicId, banner_type: 'slider', banner_images: images }, { onConflict: 'id' })
  if (error) return { error: error.message }
  updateTag('clinic-info')
  revalidatePath('/panel')
  return { ok: true }
}

export async function uploadGalleryImage(formData: FormData): Promise<Result> {
  const supabase = await dentistClient()
  if (!supabase) return { error: 'No autorizado.' }
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Selecciona una imagen.' }

  const fileName = `${Date.now()}-${file.name}`
  const { error: upErr } = await supabase.storage.from(GALLERY_BUCKET).upload(fileName, file)
  if (upErr) return { error: upErr.message }
  const {
    data: { publicUrl },
  } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(fileName)
  const { error: insErr } = await supabase
    .from('gallery')
    .insert({ image_url: publicUrl, file_path: fileName })
  if (insErr) return { error: insErr.message }

  updateTag('gallery')
  revalidatePath('/panel')
  return { ok: true }
}

export async function deleteGalleryImage(id: string, filePath: string): Promise<Result> {
  const supabase = await dentistClient()
  if (!supabase) return { error: 'No autorizado.' }
  if (filePath) await supabase.storage.from(GALLERY_BUCKET).remove([filePath])
  const { error } = await supabase.from('gallery').delete().eq('id', id)
  if (error) return { error: error.message }
  updateTag('gallery')
  revalidatePath('/panel')
  return { ok: true }
}

// Generic image upload for the banner + logo. Returns the public URL; the
// caller decides how to persist it (banner auto-saves, logo waits for "Guardar").
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const supabase = await dentistClient()
  if (!supabase) return { error: 'No autorizado.' }
  const file = formData.get('file')
  const folder = String(formData.get('folder') ?? 'misc')
  if (!(file instanceof File) || file.size === 0) return { error: 'Selecciona una imagen.' }

  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
  const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(fileName, file, { upsert: true })
  if (error) return { error: error.message }
  const {
    data: { publicUrl },
  } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(fileName)
  return { url: publicUrl }
}
