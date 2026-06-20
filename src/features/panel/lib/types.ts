// Shared row shapes for the dentist panel. Client tabs import these with
// `import type`, so this module never reaches the browser bundle.

export interface PanelAppointment {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  payment_method: 'cash' | 'online'
  payment_status: 'pending' | 'paid'
  services: { name: string; duration_minutes: number; price_cop: number } | null
  profiles: { full_name: string; email: string; phone: string | null } | null
}

export interface PanelService {
  id: string
  name: string
  duration_minutes: number
  price_cop: number
  is_active: boolean
}

export interface PanelClinicInfo {
  id: string
  address: string
  phone: string
  email: string
  morning_start: string
  morning_end: string
  afternoon_start: string
  afternoon_end: string
  working_days: number[]
  clinic_name: string
  logo_url: string | null
  feature_1_title: string
  feature_1_desc: string
  feature_2_title: string
  feature_2_desc: string
  feature_3_title: string
  feature_3_desc: string
  banner_subtitle: string
  banner_type: 'gradient' | 'color' | 'slider'
  banner_color_from: string
  banner_color_to: string
  banner_images: string[]
}

export interface GalleryItem {
  id: string
  image_url: string
  file_path: string
}

export interface EarningsMonth {
  month: string
  label: string
  total: number
  count: number
}
