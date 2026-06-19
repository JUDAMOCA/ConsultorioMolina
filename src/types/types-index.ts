export interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  role: 'patient' | 'dentist'
  created_at: string
}

export interface Service {
  id: string
  name: string
  duration_minutes: number
  description?: string
  price_cop?: number
  created_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  service_id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  payment_method: 'cash' | 'online'
  payment_status: 'pending' | 'paid'
  notes?: string
  created_at: string
  profiles?: Profile
  services?: Service
}

export interface GalleryItem {
  id: string
  image_url: string
  caption?: string
  created_at: string
}
