'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'

// ─────────────────────────────────────────────
// Calendario semanal – constantes de posición
// ─────────────────────────────────────────────
const PX_PER_MIN = 1.2
const START_MINUTES = 480   // 08:00
const END_MINUTES   = 1080  // 18:00
const TOTAL_PX = (END_MINUTES - START_MINUTES) * PX_PER_MIN

const HOUR_LABELS = ['8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm']
const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const DAY_NAMES_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const STATUS_COLOR: Record<string,string> = {
  pending: 'bg-yellow-200 border-yellow-400 text-yellow-900',
  confirmed: 'bg-green-200 border-green-400 text-green-900',
  cancelled: 'bg-slate-200 border-slate-400 text-slate-500',
}

function timeToMin(t: string) {
  const [h,m] = t.split(':').map(Number)
  return h * 60 + m
}

function getWeekDates(base: Date) {
  const mon = new Date(base)
  const day = mon.getDay()
  const diff = day === 0 ? -6 : 1 - day
  mon.setDate(mon.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return d
  })
}

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface Service { id: string; name: string; duration_minutes: number; price_cop: number; is_active: boolean }
interface ClinicInfo {
  id: string; address: string; phone: string; email: string
  morning_start: string; morning_end: string
  afternoon_start: string; afternoon_end: string
  working_days: number[]
  clinic_name: string; logo_url: string | null
  feature_1_title: string; feature_1_desc: string
  feature_2_title: string; feature_2_desc: string
  feature_3_title: string; feature_3_desc: string
  banner_subtitle: string
  banner_type: 'gradient' | 'color' | 'slider'
  banner_color_from: string; banner_color_to: string
  banner_images: string[]
}

// ─────────────────────────────────────────────
// Panel principal
// ─────────────────────────────────────────────
export default function PanelPage() {
  const supabase = createClient()
  const router = useRouter()

  const [tab, setTab] = useState<'calendar'|'ganancias'|'servicios'|'info'|'galeria'|'qr'>('calendar')
  const [appointments, setAppointments] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [weekBase, setWeekBase] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, week: 0, pending: 0 })
  const fileRef = useRef<HTMLInputElement>(null)

  // Gallery
  const [gallery, setGallery] = useState<any[]>([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // QR
  const [siteUrl, setSiteUrl] = useState('')

  // Services
  const [services, setServices] = useState<Service[]>([])
  const [svcLoading, setSvcLoading] = useState(false)
  const [showSvcForm, setShowSvcForm] = useState(false)
  const [editingSvc, setEditingSvc] = useState<Service | null>(null)
  const [svcName, setSvcName] = useState('')
  const [svcDuration, setSvcDuration] = useState('')
  const [svcPrice, setSvcPrice] = useState('')
  const [svcSaving, setSvcSaving] = useState(false)

  // Earnings
  const [earnings, setEarnings] = useState<{ month: string; label: string; total: number; count: number }[]>([])
  const [earningsLoading, setEarningsLoading] = useState(false)

  // Clinic info
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null)
  const [ciLoading, setCiLoading] = useState(false)
  const [ciSaving, setCiSaving] = useState(false)
  const [ciMsg, setCiMsg] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const [bannerUploading, setBannerUploading] = useState(false)
  const bannerRef = useRef<HTMLInputElement>(null)

  // ── Auth check
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'dentist') { router.push('/'); return }
      setSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
      loadAppointments()
    }
    check()
  }, [])

  // ── Load appointments
  const loadAppointments = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('*, services(name, duration_minutes, price_cop), profiles(full_name, email, phone)')
      .order('appointment_date').order('start_time')
    const list = data || []
    setAppointments(list)
    const today = new Date()
    const monday = getWeekDates(today)[1]
    const friday = getWeekDates(today)[5]
    const monStr = monday.toISOString().slice(0,10)
    const friStr = friday.toISOString().slice(0,10)
    const active = list.filter(a => a.status !== 'cancelled')
    setStats({
      total: active.length,
      week: active.filter(a => a.appointment_date >= monStr && a.appointment_date <= friStr).length,
      pending: active.filter(a => a.status === 'pending').length,
    })
    setLoading(false)
  }

  // ── Load gallery
  const loadGallery = async () => {
    setGalleryLoading(true)
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false })
    setGallery(data || [])
    setGalleryLoading(false)
  }

  // ── Load services
  const loadServices = async () => {
    setSvcLoading(true)
    const { data } = await supabase.from('services').select('*').order('name')
    setServices(data || [])
    setSvcLoading(false)
  }

  // ── Load clinic info
  const loadClinicInfo = async () => {
    setCiLoading(true)
    const { data } = await supabase.from('clinic_info').select('*').limit(1).single()
    if (data) setClinicInfo(data)
    setCiLoading(false)
  }

  // ── Load earnings (last 6 months)
  const loadEarnings = async () => {
    setEarningsLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('appointment_date, services(price_cop)')
      .neq('status', 'cancelled')
    const list = data || []

    // Build last 6 months
    const months: { month: string; label: string; total: number; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7) // "2025-03"
      const label = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
      const matching = list.filter(a => a.appointment_date?.startsWith(key))
      const total = matching.reduce((sum: number, a: any) => sum + (a.services?.price_cop ?? 0), 0)
      months.push({ month: key, label, total, count: matching.length })
    }
    setEarnings(months)
    setEarningsLoading(false)
  }

  useEffect(() => {
    if (tab === 'galeria') loadGallery()
    if (tab === 'servicios') loadServices()
    if (tab === 'info') loadClinicInfo()
    if (tab === 'ganancias') loadEarnings()
  }, [tab])

  // ── Gallery upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error } = await supabase.storage.from('gallery').upload(fileName, file)
    if (error) { alert('Error al subir: ' + error.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fileName)
    const { error: insertError } = await supabase.from('gallery').insert({ image_url: publicUrl, file_path: fileName })
    if (insertError) { alert('Error al guardar en galería: ' + insertError.message); setUploading(false); return }
    loadGallery()
    setUploading(false)
  }

  const handleDeleteImage = async (item: any) => {
    if (!confirm('¿Eliminar esta imagen?')) return
    await supabase.storage.from('gallery').remove([item.file_path])
    await supabase.from('gallery').delete().eq('id', item.id)
    setGallery(prev => prev.filter(g => g.id !== item.id))
  }

  // ── Service CRUD
  const openNewSvc = () => {
    setEditingSvc(null); setSvcName(''); setSvcDuration(''); setSvcPrice('')
    setShowSvcForm(true)
  }
  const openEditSvc = (s: Service) => {
    setEditingSvc(s); setSvcName(s.name)
    setSvcDuration(String(s.duration_minutes)); setSvcPrice(String(s.price_cop))
    setShowSvcForm(true)
  }
  const saveSvc = async () => {
    if (!svcName || !svcDuration || !svcPrice) return
    setSvcSaving(true)
    const payload = { name: svcName, duration_minutes: Number(svcDuration), price_cop: Number(svcPrice), is_active: true }
    if (editingSvc) {
      await supabase.from('services').update(payload).eq('id', editingSvc.id)
    } else {
      await supabase.from('services').insert(payload)
    }
    setShowSvcForm(false)
    setSvcSaving(false)
    loadServices()
  }
  const deleteSvc = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return
    await supabase.from('services').update({ is_active: false }).eq('id', id)
    loadServices()
  }

  // ── Clinic info save
  const saveClinicInfo = async () => {
    if (!clinicInfo) return
    setCiSaving(true)
    setCiMsg('')
    const payload = {
      id: clinicInfo.id,
      clinic_name: clinicInfo.clinic_name,
      logo_url: clinicInfo.logo_url,
      address: clinicInfo.address,
      phone: clinicInfo.phone,
      email: clinicInfo.email,
      morning_start: clinicInfo.morning_start,
      morning_end: clinicInfo.morning_end,
      afternoon_start: clinicInfo.afternoon_start,
      afternoon_end: clinicInfo.afternoon_end,
      working_days: clinicInfo.working_days ?? [1,2,3,4,5],
      feature_1_title: clinicInfo.feature_1_title,
      feature_1_desc: clinicInfo.feature_1_desc,
      feature_2_title: clinicInfo.feature_2_title,
      feature_2_desc: clinicInfo.feature_2_desc,
      feature_3_title: clinicInfo.feature_3_title,
      feature_3_desc: clinicInfo.feature_3_desc,
      banner_subtitle: clinicInfo.banner_subtitle ?? '',
      banner_type: clinicInfo.banner_type ?? 'gradient',
      banner_color_from: clinicInfo.banner_color_from ?? '#0284c7',
      banner_color_to: clinicInfo.banner_color_to ?? '#06b6d4',
      banner_images: clinicInfo.banner_images ?? [],
    }
    const { error } = await supabase.from('clinic_info').upsert(payload, { onConflict: 'id' })
    if (error) {
      setCiMsg('❌ Error al guardar: ' + error.message)
    } else {
      setCiMsg('✅ ¡Guardado correctamente!')
    }
    setTimeout(() => setCiMsg(''), 4000)
    setCiSaving(false)
  }

  const toggleDay = (d: number) => {
    if (!clinicInfo) return
    const current = clinicInfo.working_days ?? [1,2,3,4,5]
    const days = current.includes(d)
      ? current.filter(x => x !== d)
      : [...current, d].sort()
    setClinicInfo({ ...clinicInfo, working_days: days })
  }

  // ── Banner image upload (guarda automáticamente en BD)
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !clinicInfo) return
    setBannerUploading(true)
    const newUrls: string[] = []
    for (const file of files) {
      const fileName = `banners/banner-${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
      const { error } = await supabase.storage.from('gallery').upload(fileName, file, { upsert: true })
      if (error) { alert('Error subiendo imagen: ' + error.message); continue }
      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fileName)
      newUrls.push(publicUrl)
    }
    const updatedImages = [...(clinicInfo.banner_images ?? []), ...newUrls]
    const updatedInfo = { ...clinicInfo, banner_type: 'slider' as const, banner_images: updatedImages }
    setClinicInfo(updatedInfo)
    // Guardar automáticamente en BD
    await supabase.from('clinic_info').upsert({
      id: clinicInfo.id,
      banner_type: 'slider',
      banner_images: updatedImages,
    }, { onConflict: 'id' })
    setBannerUploading(false)
    if (e.target) e.target.value = ''
  }

  const removeBannerImage = async (url: string) => {
    if (!clinicInfo) return
    const updatedImages = clinicInfo.banner_images.filter(u => u !== url)
    setClinicInfo({ ...clinicInfo, banner_images: updatedImages })
    // Guardar automáticamente en BD
    await supabase.from('clinic_info').upsert({
      id: clinicInfo.id,
      banner_images: updatedImages,
    }, { onConflict: 'id' })
  }

  // ── Logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !clinicInfo) return
    setLogoUploading(true)
    const fileName = `logos/logo-${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('gallery').upload(fileName, file, { upsert: true })
    if (error) { alert('Error al subir logo: ' + error.message); setLogoUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fileName)
    setClinicInfo({ ...clinicInfo, logo_url: publicUrl })
    setLogoUploading(false)
  }

  // ── Appointment status update
  const updateStatus = async (id: string, status: string) => {
    await supabase.from('appointments').update({ status }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    if (selected?.id === id) setSelected((s: any) => ({ ...s, status }))
  }

  // ── Calendar render
  const weekDates = getWeekDates(weekBase)

  const apptsByDay: Record<string, any[]> = {}
  weekDates.forEach(d => {
    const key = d.toISOString().slice(0,10)
    apptsByDay[key] = appointments.filter(a => a.appointment_date === key && a.status !== 'cancelled')
  })

  const TABS = [
    { key: 'calendar', label: '📅 Calendario' },
    { key: 'ganancias', label: '💰 Ganancias' },
    { key: 'servicios', label: '🦷 Servicios' },
    { key: 'info', label: '🏥 Información' },
    { key: 'galeria', label: '🖼️ Galería' },
    { key: 'qr', label: '📱 QR' },
  ] as const

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">🦷 Panel del odontólogo</h1>
          <button onClick={() => { supabase.auth.signOut(); router.push('/') }}
            className="text-sm text-slate-500 hover:text-red-500 transition-colors">
            Cerrar sesión →
          </button>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${tab === t.key ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ─── TAB: CALENDARIO ─── */}
        {tab === 'calendar' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total citas', value: stats.total, icon: '📋' },
                { label: 'Esta semana', value: stats.week, icon: '📅' },
                { label: 'Pendientes', value: stats.pending, icon: '⏳' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-3xl font-bold text-slate-800">{s.value}</div>
                  <div className="text-sm text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Week nav */}
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate()-7); setWeekBase(d) }}
                className="btn-secondary text-sm px-3 py-1">← Ant.</button>
              <span className="font-semibold text-slate-700">
                {weekDates[1].toLocaleDateString('es-CO',{day:'numeric',month:'short'})} – {weekDates[5].toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})}
              </span>
              <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate()+7); setWeekBase(d) }}
                className="btn-secondary text-sm px-3 py-1">Sig. →</button>
              <button onClick={() => setWeekBase(new Date())}
                className="text-xs text-sky-600 hover:underline ml-2">Hoy</button>
            </div>

            {loading ? (
              <div className="card text-center py-20 text-slate-400">Cargando citas...</div>
            ) : (
              <div className="flex gap-4">
                {/* Calendar grid */}
                <div className="flex-1 overflow-x-auto">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-w-[700px]">
                    {/* Day headers */}
                    <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
                      <div />
                      {weekDates.map((d,i) => {
                        const isToday = d.toISOString().slice(0,10) === new Date().toISOString().slice(0,10)
                        return (
                          <div key={i} className={`text-center py-3 text-sm font-semibold border-l border-slate-100 ${isToday ? 'bg-sky-50 text-sky-700' : 'text-slate-600'}`}>
                            <div>{DAY_NAMES[d.getDay()]}</div>
                            <div className={`text-xl font-bold ${isToday ? 'text-sky-600' : 'text-slate-800'}`}>{d.getDate()}</div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Time grid */}
                    <div className="relative flex" style={{ height: TOTAL_PX + 'px' }}>
                      {/* Hour lines */}
                      <div className="w-12 flex-shrink-0 relative">
                        {HOUR_LABELS.map((h,i) => (
                          <div key={h} className="absolute right-2 text-xs text-slate-400" style={{ top: i * 60 * PX_PER_MIN - 8 }}>{h}</div>
                        ))}
                      </div>
                      {/* Horizontal hour lines */}
                      <div className="absolute inset-0 ml-12 pointer-events-none">
                        {HOUR_LABELS.map((_,i) => (
                          <div key={i} className="absolute w-full border-t border-slate-100" style={{ top: i * 60 * PX_PER_MIN }} />
                        ))}
                        {/* Lunch break shading */}
                        <div className="absolute w-full bg-slate-50/60"
                          style={{ top: (720-START_MINUTES)*PX_PER_MIN, height: (840-720)*PX_PER_MIN }} />
                      </div>
                      {/* Day columns */}
                      {weekDates.map((d,i) => {
                        const key = d.toISOString().slice(0,10)
                        const dayAppts = apptsByDay[key] || []
                        return (
                          <div key={i} className="flex-1 relative border-l border-slate-100">
                            {dayAppts.map(appt => {
                              const start = timeToMin(appt.start_time)
                              const end = timeToMin(appt.end_time)
                              const top = (start - START_MINUTES) * PX_PER_MIN
                              const height = Math.max((end - start) * PX_PER_MIN, 20)
                              return (
                                <div key={appt.id}
                                  onClick={() => setSelected(appt)}
                                  className={`absolute left-1 right-1 rounded-lg border px-1 py-0.5 text-xs cursor-pointer overflow-hidden hover:opacity-90 transition-opacity ${STATUS_COLOR[appt.status]}`}
                                  style={{ top, height }}>
                                  <div className="font-semibold truncate">{appt.services?.name}</div>
                                  <div className="opacity-80 truncate">{appt.profiles?.full_name}</div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Detail sidebar */}
                {selected && (
                  <div className="w-72 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sticky top-24">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-slate-800">Detalle de cita</h3>
                        <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div><span className="label text-xs">Servicio</span><p className="font-semibold">{selected.services?.name}</p></div>
                        <div><span className="label text-xs">Paciente</span><p>{selected.profiles?.full_name}</p></div>
                        {selected.profiles?.phone && <div><span className="label text-xs">Teléfono</span><p>{selected.profiles.phone}</p></div>}
                        <div><span className="label text-xs">Email</span><p className="truncate">{selected.profiles?.email}</p></div>
                        <div><span className="label text-xs">Fecha</span><p>{new Date(selected.appointment_date+'T12:00:00').toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}</p></div>
                        <div><span className="label text-xs">Hora</span><p>{selected.start_time?.slice(0,5)} – {selected.end_time?.slice(0,5)}</p></div>
                        <div><span className="label text-xs">Pago</span><p>{selected.payment_method === 'cash' ? '💵 Efectivo' : '💳 En línea'} · {selected.payment_status === 'paid' ? '✅ Pagado' : '⏳ Pendiente'}</p></div>
                        <div>
                          <span className="label text-xs">Estado</span>
                          <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium mt-1 ${STATUS_COLOR[selected.status]}`}>
                            {selected.status === 'pending' ? 'Pendiente' : selected.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                          </span>
                        </div>
                      </div>
                      {selected.status !== 'cancelled' && (
                        <div className="mt-4 space-y-2">
                          {selected.status !== 'confirmed' && (
                            <button onClick={() => updateStatus(selected.id, 'confirmed')}
                              className="w-full bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-2 rounded-xl text-sm transition-colors">
                              ✅ Confirmar cita
                            </button>
                          )}
                          <button onClick={() => updateStatus(selected.id, 'cancelled')}
                            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-xl text-sm transition-colors">
                            ❌ Cancelar cita
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ─── TAB: GANANCIAS ─── */}
        {tab === 'ganancias' && (() => {
          const maxTotal = Math.max(...earnings.map(e => e.total), 1)
          const thisMonth = earnings[earnings.length - 1]
          const lastMonth = earnings[earnings.length - 2]
          const totalYear = earnings.reduce((s, e) => s + e.total, 0)
          const totalCitas = earnings.reduce((s, e) => s + e.count, 0)

          return (
            <div className="max-w-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">💰 Ganancias</h2>
                <p className="text-slate-500 text-sm mt-1">Ingresos de citas activas (no canceladas) de los últimos 6 meses</p>
              </div>

              {earningsLoading ? (
                <div className="card text-center py-12 text-slate-400">Calculando...</div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="card bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
                      <p className="text-xs text-sky-600 font-medium mb-1">Este mes</p>
                      <p className="text-2xl font-bold text-sky-700">
                        ${(thisMonth?.total ?? 0).toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs text-sky-500 mt-1">{thisMonth?.count ?? 0} citas</p>
                      {lastMonth && lastMonth.total > 0 && (
                        <p className={`text-xs mt-1 font-medium ${(thisMonth?.total ?? 0) >= lastMonth.total ? 'text-green-600' : 'text-red-500'}`}>
                          {(thisMonth?.total ?? 0) >= lastMonth.total ? '↑' : '↓'}{' '}
                          {Math.abs(Math.round(((thisMonth?.total ?? 0) - lastMonth.total) / lastMonth.total * 100))}% vs mes anterior
                        </p>
                      )}
                    </div>
                    <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                      <p className="text-xs text-emerald-600 font-medium mb-1">Últimos 6 meses</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        ${totalYear.toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs text-emerald-500 mt-1">{totalCitas} citas en total</p>
                    </div>
                  </div>

                  {/* Bar chart */}
                  <div className="card">
                    <h3 className="font-bold text-slate-700 mb-6">Ingresos por mes</h3>
                    <div className="flex items-end gap-3 h-48">
                      {earnings.map((e, i) => {
                        const isCurrentMonth = i === earnings.length - 1
                        const heightPct = maxTotal > 0 ? (e.total / maxTotal) * 100 : 0
                        return (
                          <div key={e.month} className="flex-1 flex flex-col items-center gap-2">
                            <div className="text-xs text-slate-500 font-medium text-center">
                              {e.total > 0 ? `$${Math.round(e.total/1000)}k` : '—'}
                            </div>
                            <div className="w-full flex items-end" style={{ height: '140px' }}>
                              <div
                                className={`w-full rounded-t-lg transition-all ${isCurrentMonth ? 'bg-sky-500' : 'bg-sky-200'}`}
                                style={{ height: `${Math.max(heightPct, e.total > 0 ? 4 : 0)}%` }}
                                title={`$${e.total.toLocaleString('es-CO')} · ${e.count} citas`}
                              />
                            </div>
                            <div className="text-xs text-slate-500 text-center">{e.label}</div>
                            {e.count > 0 && (
                              <div className="text-xs text-slate-400">{e.count} citas</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-sky-500" /> Mes actual</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-sky-200" /> Meses anteriores</div>
                    </div>
                  </div>

                  {/* Monthly breakdown */}
                  <div className="card mt-4">
                    <h3 className="font-bold text-slate-700 mb-4">Detalle por mes</h3>
                    <div className="space-y-2">
                      {[...earnings].reverse().map(e => (
                        <div key={e.month} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                          <div>
                            <span className="font-medium text-slate-700 capitalize">{e.label}</span>
                            <span className="text-xs text-slate-400 ml-2">· {e.count} citas</span>
                          </div>
                          <span className={`font-bold ${e.total > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                            {e.total > 0 ? `$${e.total.toLocaleString('es-CO')}` : '$0'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })()}

        {/* ─── TAB: SERVICIOS ─── */}
        {tab === 'servicios' && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">🦷 Servicios</h2>
                <p className="text-slate-500 text-sm mt-1">Gestiona los servicios del consultorio</p>
              </div>
              <button onClick={openNewSvc} className="btn-primary">+ Agregar servicio</button>
            </div>

            {/* Form */}
            {showSvcForm && (
              <div className="card mb-6 border-2 border-sky-200">
                <h3 className="font-bold text-slate-800 mb-4">{editingSvc ? 'Editar servicio' : 'Nuevo servicio'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Nombre del servicio</label>
                    <input className="input" placeholder="Ej: Limpieza dental" value={svcName} onChange={e => setSvcName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Duración (minutos)</label>
                      <input type="number" className="input" placeholder="30" value={svcDuration} onChange={e => setSvcDuration(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Precio (COP)</label>
                      <input type="number" className="input" placeholder="80000" value={svcPrice} onChange={e => setSvcPrice(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={saveSvc} disabled={svcSaving} className="btn-primary">
                      {svcSaving ? 'Guardando...' : editingSvc ? '💾 Guardar cambios' : '➕ Crear servicio'}
                    </button>
                    <button onClick={() => setShowSvcForm(false)} className="btn-secondary">Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            {svcLoading ? (
              <div className="card text-center py-12 text-slate-400">Cargando servicios...</div>
            ) : services.length === 0 ? (
              <div className="card text-center py-12 text-slate-400">
                <p className="text-4xl mb-3">🦷</p>
                <p>Aún no hay servicios. ¡Agrega el primero!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map(svc => (
                  <div key={svc.id} className="card flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-800">{svc.name}</p>
                      <p className="text-sm text-slate-500">
                        ⏱ {svc.duration_minutes} min · 💰 ${svc.price_cop.toLocaleString('es-CO')} COP
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditSvc(svc)}
                        className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-medium text-sm px-3 py-1.5 rounded-lg transition-colors">
                        ✏️ Editar
                      </button>
                      <button onClick={() => deleteSvc(svc.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm px-3 py-1.5 rounded-lg transition-colors">
                        🗑 Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: INFORMACIÓN DEL CONSULTORIO ─── */}
        {tab === 'info' && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">🏥 Información del consultorio</h2>
              <p className="text-slate-500 text-sm mt-1">Esta información se muestra en la página de inicio y afecta los horarios de citas</p>
            </div>

            {ciLoading || !clinicInfo ? (
              <div className="card text-center py-12 text-slate-400">Cargando...</div>
            ) : (
              <div className="space-y-6">
                {/* Banner del hero */}
                <div className="card">
                  <h3 className="font-bold text-slate-700 mb-4">🖼️ Banner principal (hero)</h3>

                  {/* Type selector */}
                  <div className="flex gap-2 mb-5">
                    {([
                      { key: 'gradient', label: '🎨 Gradiente' },
                      { key: 'color', label: '🟦 Color sólido' },
                      { key: 'slider', label: '🖼️ Fotos' },
                    ] as const).map(({ key, label }) => (
                      <button key={key}
                        onClick={() => setClinicInfo({ ...clinicInfo, banner_type: key })}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${clinicInfo.banner_type === key ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Preview */}
                  <div className="rounded-xl overflow-hidden mb-4 h-24 w-full relative"
                    style={clinicInfo.banner_type === 'gradient'
                      ? { background: `linear-gradient(135deg, ${clinicInfo.banner_color_from ?? '#0284c7'}, ${clinicInfo.banner_color_to ?? '#06b6d4'})` }
                      : clinicInfo.banner_type === 'color'
                      ? { background: clinicInfo.banner_color_from ?? '#0284c7' }
                      : {}}>
                    {clinicInfo.banner_type === 'slider' && (clinicInfo.banner_images ?? []).length > 0 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={clinicInfo.banner_images[0]} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    {clinicInfo.banner_type === 'slider' && (clinicInfo.banner_images ?? []).length === 0 && (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-sm">Sin fotos aún</div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-sm opacity-60">Vista previa</span>
                    </div>
                  </div>

                  {/* Gradient / Color controls */}
                  {(clinicInfo.banner_type === 'gradient' || clinicInfo.banner_type === 'color') && (
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="label">{clinicInfo.banner_type === 'gradient' ? 'Color inicial' : 'Color de fondo'}</label>
                        <div className="flex items-center gap-2">
                          <input type="color" className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                            value={clinicInfo.banner_color_from ?? '#0284c7'}
                            onChange={e => setClinicInfo({ ...clinicInfo, banner_color_from: e.target.value })} />
                          <input className="input flex-1" value={clinicInfo.banner_color_from ?? '#0284c7'}
                            onChange={e => setClinicInfo({ ...clinicInfo, banner_color_from: e.target.value })} />
                        </div>
                      </div>
                      {clinicInfo.banner_type === 'gradient' && (
                        <div className="flex-1">
                          <label className="label">Color final</label>
                          <div className="flex items-center gap-2">
                            <input type="color" className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                              value={clinicInfo.banner_color_to ?? '#06b6d4'}
                              onChange={e => setClinicInfo({ ...clinicInfo, banner_color_to: e.target.value })} />
                            <input className="input flex-1" value={clinicInfo.banner_color_to ?? '#06b6d4'}
                              onChange={e => setClinicInfo({ ...clinicInfo, banner_color_to: e.target.value })} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Slider controls */}
                  {clinicInfo.banner_type === 'slider' && (
                    <div>
                      <input type="file" ref={bannerRef} className="hidden" accept="image/*" multiple onChange={handleBannerUpload} />
                      <button onClick={() => bannerRef.current?.click()} disabled={bannerUploading}
                        className="btn-secondary text-sm mb-4">
                        {bannerUploading ? '⬆️ Subiendo...' : '⬆️ Agregar fotos al banner'}
                      </button>
                      <p className="text-xs text-slate-400 mb-3">Puedes subir varias fotos. Pasarán automáticamente cada 4 segundos.</p>
                      {(clinicInfo.banner_images ?? []).length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {clinicInfo.banner_images.map((url, i) => (
                            <div key={i} className="relative group rounded-xl overflow-hidden" style={{ aspectRatio: '16/5' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Banner ${i+1}`} className="w-full h-full object-cover" />
                              <button onClick={() => void removeBannerImage(url)}
                                className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Identidad del consultorio */}
                <div className="card">
                  <h3 className="font-bold text-slate-700 mb-4">🏷️ Identidad del consultorio</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="label">Nombre del consultorio</label>
                      <input className="input" value={clinicInfo.clinic_name ?? ''}
                        onChange={e => setClinicInfo({ ...clinicInfo, clinic_name: e.target.value })}
                        placeholder="Consultorio Juan Carlos Molina" />
                    </div>
                    <div>
                      <label className="label">Subtitulo del banner</label>
                      <textarea className="input resize-none" rows={2}
                        value={clinicInfo.banner_subtitle ?? ''}
                        onChange={e => setClinicInfo({ ...clinicInfo, banner_subtitle: e.target.value })}
                        placeholder="Tu salud dental en manos expertas." />
                    </div>
                    <div>
                      <label className="label">Logo</label>
                      <div className="flex items-center gap-4">
                        {clinicInfo.logo_url && (
                          <img src={clinicInfo.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1" />
                        )}
                        <div>
                          <input type="file" ref={logoRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          <button onClick={() => logoRef.current?.click()} disabled={logoUploading}
                            className="btn-secondary text-sm py-2">
                            {logoUploading ? 'Subiendo...' : clinicInfo.logo_url ? '🔄 Cambiar logo' : '⬆️ Subir logo'}
                          </button>
                          {clinicInfo.logo_url && (
                            <button onClick={() => setClinicInfo({ ...clinicInfo, logo_url: null })}
                              className="ml-2 text-xs text-red-500 hover:underline">Quitar logo</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Textos de características */}
                <div className="card">
                  <h3 className="font-bold text-slate-700 mb-4">✨ Textos de características (página de inicio)</h3>
                  <div className="space-y-5">
                    {([
                      { n: 1, icon: '⏰' },
                      { n: 2, icon: '🏆' },
                      { n: 3, icon: '💳' },
                    ] as const).map(({ n, icon }) => (
                      <div key={n} className="p-4 bg-slate-50 rounded-xl space-y-2">
                        <p className="text-xs text-slate-500 font-medium">{icon} Característica {n}</p>
                        <input className="input" placeholder="Título"
                          value={(clinicInfo as any)[`feature_${n}_title`] ?? ''}
                          onChange={e => setClinicInfo({ ...clinicInfo, [`feature_${n}_title`]: e.target.value } as any)} />
                        <textarea className="input resize-none h-16" placeholder="Descripción"
                          value={(clinicInfo as any)[`feature_${n}_desc`] ?? ''}
                          onChange={e => setClinicInfo({ ...clinicInfo, [`feature_${n}_desc`]: e.target.value } as any)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Datos de contacto */}
                <div className="card">
                  <h3 className="font-bold text-slate-700 mb-4">📋 Datos de contacto</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="label">Dirección</label>
                      <input className="input" value={clinicInfo.address}
                        onChange={e => setClinicInfo({ ...clinicInfo, address: e.target.value })}
                        placeholder="Calle 123 # 45-67, Bogotá" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Teléfono</label>
                        <input className="input" value={clinicInfo.phone}
                          onChange={e => setClinicInfo({ ...clinicInfo, phone: e.target.value })}
                          placeholder="+57 300 000 0000" />
                      </div>
                      <div>
                        <label className="label">Email</label>
                        <input type="email" className="input" value={clinicInfo.email}
                          onChange={e => setClinicInfo({ ...clinicInfo, email: e.target.value })}
                          placeholder="contacto@consultorio.com" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Días laborales */}
                <div className="card">
                  <h3 className="font-bold text-slate-700 mb-4">📅 Días de atención</h3>
                  <div className="flex gap-2 flex-wrap">
                    {[0,1,2,3,4,5,6].map(d => (
                      <button key={d} onClick={() => toggleDay(d)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${(clinicInfo.working_days ?? [1,2,3,4,5]).includes(d) ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
                        {DAY_NAMES_FULL[d].slice(0,3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horarios */}
                <div className="card">
                  <h3 className="font-bold text-slate-700 mb-4">🕐 Horarios de atención</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">Jornada mañana</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Inicio</label>
                          <input type="time" className="input" value={clinicInfo.morning_start}
                            onChange={e => setClinicInfo({ ...clinicInfo, morning_start: e.target.value })} />
                        </div>
                        <div>
                          <label className="label">Fin</label>
                          <input type="time" className="input" value={clinicInfo.morning_end}
                            onChange={e => setClinicInfo({ ...clinicInfo, morning_end: e.target.value })} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">Jornada tarde</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Inicio</label>
                          <input type="time" className="input" value={clinicInfo.afternoon_start}
                            onChange={e => setClinicInfo({ ...clinicInfo, afternoon_start: e.target.value })} />
                        </div>
                        <div>
                          <label className="label">Fin</label>
                          <input type="time" className="input" value={clinicInfo.afternoon_end}
                            onChange={e => setClinicInfo({ ...clinicInfo, afternoon_end: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-sm text-sky-700">
                    💡 Los cambios de horario se reflejan automáticamente al agendar nuevas citas.
                  </div>
                </div>

                {ciMsg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-medium">{ciMsg}</div>}

                <button onClick={saveClinicInfo} disabled={ciSaving} className="btn-primary w-full py-3">
                  {ciSaving ? 'Guardando...' : '💾 Guardar cambios'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: GALERÍA ─── */}
        {tab === 'galeria' && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">🖼️ Galería</h2>
                <p className="text-slate-500 text-sm mt-1">Fotos que se muestran en la página de inicio</p>
              </div>
              <div>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleUpload} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary">
                  {uploading ? '⬆️ Subiendo...' : '+ Subir foto'}
                </button>
              </div>
            </div>

            {galleryLoading ? (
              <div className="card text-center py-12 text-slate-400">Cargando galería...</div>
            ) : gallery.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-5xl mb-4">🖼️</div>
                <p className="text-slate-500">No hay fotos aún. ¡Sube la primera!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gallery.map(item => (
                  <div key={item.id} className="relative group rounded-2xl overflow-hidden aspect-square shadow-sm">
                    <img src={item.image_url} alt="Galería" className="w-full h-full object-cover" />
                    <button onClick={() => handleDeleteImage(item)}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      🗑 Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: QR ─── */}
        {tab === 'qr' && (
          <div className="max-w-sm mx-auto">
            <div className="card text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">📱 Código QR</h2>
              <p className="text-slate-500 text-sm mb-6">Comparte este código para que los pacientes accedan directamente a agendar citas</p>
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 inline-block mb-4">
                {siteUrl ? (
                  <QRCode value={`${siteUrl}/agendar`} size={200} />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm">Generando...</div>
                )}
              </div>
              <p className="text-xs text-slate-400 break-all">{siteUrl}/agendar</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
