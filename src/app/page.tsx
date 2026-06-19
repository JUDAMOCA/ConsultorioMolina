'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import GallerySection from '@/components/GallerySection'

interface Service {
  id: string
  name: string
  description?: string
  duration_minutes: number
  price_cop: number
}

interface ClinicInfo {
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

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

function formatSchedule(ci: ClinicInfo) {
  const days = (ci.working_days ?? [1, 2, 3, 4, 5]).map((d) => DAY_NAMES[d])
  const daysStr = days.length > 0 ? `${days[0]}-${days[days.length - 1]}` : 'Lun-Vie'
  const morning = `${formatTime(ci.morning_start ?? '08:00')}-${formatTime(ci.morning_end ?? '12:00')}`
  const afternoon = `${formatTime(ci.afternoon_start ?? '14:00')}-${formatTime(ci.afternoon_end ?? '18:00')}`
  return `${daysStr} ${morning} / ${afternoon}`
}

const DEFAULT_CI: ClinicInfo = {
  address: 'Direccion del consultorio',
  phone: '(000) 000-0000',
  email: 'contacto@consultorio.com',
  morning_start: '08:00',
  morning_end: '12:00',
  afternoon_start: '14:00',
  afternoon_end: '18:00',
  working_days: [1, 2, 3, 4, 5],
  clinic_name: 'Consultorio Juan Carlos Molina',
  logo_url: null,
  banner_subtitle: 'Tu salud dental en manos expertas. Agenda tu cita facil y rapido.',
  feature_1_title: 'Horarios flexibles',
  feature_1_desc: 'Lun-Vie de 8am-12pm y 2pm-6pm. Agenda online en minutos.',
  feature_2_title: 'Experiencia comprobada',
  feature_2_desc: 'Mas de 15 anos atendiendo pacientes con dedicacion y profesionalismo.',
  feature_3_title: 'Pago facil',
  feature_3_desc: 'Paga en efectivo en el consultorio o con tarjeta en linea.',
}

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([])
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [sliderIndex, setSliderIndex] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      try {
        const [svcRes, ciRes] = await Promise.all([
          supabase.from('services').select('*').order('name'),
          supabase.from('clinic_info').select('*').limit(1).maybeSingle(),
        ])
        if (svcRes.data) setServices(svcRes.data)
        if (ciRes.data) setClinicInfo(ciRes.data)
      } catch (e) {
        console.error('Error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const ci = clinicInfo ?? DEFAULT_CI
  const clinicName = ci.clinic_name || 'Consultorio Juan Carlos Molina'
  const bannerType = ci.banner_type ?? 'gradient'
  const bannerImages = ci.banner_images ?? []
  const colorFrom = ci.banner_color_from ?? '#0284c7'
  const colorTo = ci.banner_color_to ?? '#06b6d4'

  useEffect(() => {
    if (bannerType !== 'slider' || bannerImages.length <= 1) return
    const t = setInterval(() => setSliderIndex((i) => (i + 1) % bannerImages.length), 4000)
    return () => clearInterval(t)
  }, [bannerType, bannerImages.length])

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="h-[520px] bg-gradient-to-br from-sky-600 to-cyan-400 animate-pulse" />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  const bannerStyle =
    bannerType !== 'slider'
      ? {
          background:
            bannerType === 'gradient'
              ? `linear-gradient(135deg, ${colorFrom}, ${colorTo})`
              : colorFrom,
        }
      : {}

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section
        className="relative text-white py-24 px-4 overflow-hidden min-h-[340px] flex items-center"
        style={bannerStyle}
      >
        {bannerType === 'slider' && bannerImages.length > 0 && (
          <>
            {bannerImages.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                style={{ opacity: i === sliderIndex ? 1 : 0 }}
              />
            ))}
            <div className="absolute inset-0 bg-black/40" />
            {bannerImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {bannerImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSliderIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === sliderIndex ? 'bg-white scale-125' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {bannerType === 'slider' && bannerImages.length === 0 && (
          <div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-cyan-400" />
        )}

        <div className="relative z-10 max-w-4xl mx-auto text-center w-full">
          {ci.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ci.logo_url}
              alt="Logo"
              className="w-24 h-24 object-contain mx-auto mb-6 rounded-2xl bg-white/10 p-2"
            />
          )}
          <h1 className="text-5xl font-bold mb-4 leading-tight drop-shadow-sm">{clinicName}</h1>
          <p className="text-xl text-white/90 mb-8 max-w-xl mx-auto drop-shadow-sm">
            {ci.banner_subtitle || 'Tu salud dental en manos expertas.'}
          </p>
          <Link
            href="/agendar"
            className="bg-white text-sky-700 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-sky-50 transition-all shadow-lg inline-block"
          >
            Agendar cita ahora
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: ci.feature_1_title || 'Horarios flexibles',
              desc: ci.feature_1_desc || 'Lun-Vie de 8am-12pm y 2pm-6pm.',
            },
            {
              title: ci.feature_2_title || 'Experiencia comprobada',
              desc: ci.feature_2_desc || 'Mas de 15 anos atendiendo pacientes.',
            },
            {
              title: ci.feature_3_title || 'Pago facil',
              desc: ci.feature_3_desc || 'Paga en efectivo o con tarjeta.',
            },
          ].map((f) => (
            <div key={f.title} className="text-center p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 text-lg mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="servicios" className="py-16 px-4 bg-sky-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-3">Nuestros Servicios</h2>
          <p className="text-center text-slate-500 mb-10">Tratamientos dentales con la mas alta calidad</p>
          {services.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <div className="text-5xl mb-3">🦷</div>
              <p>Los servicios apareceran aqui pronto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg">{svc.name}</h3>
                    {svc.description && (
                      <p className="text-slate-500 text-sm mt-1">{svc.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-slate-400">
                        {svc.duration_minutes >= 60
                          ? `${Math.floor(svc.duration_minutes / 60)} hora`
                          : `${svc.duration_minutes} min`}
                      </span>
                      <span className="font-bold text-sky-600 text-lg">
                        ${svc.price_cop.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/agendar" className="btn-primary px-8 py-3 text-lg">
              Agendar ahora
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="galeria" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-3">Galeria</h2>
          <p className="text-center text-slate-500 mb-10">
            Conoce nuestro consultorio y los resultados de nuestros tratamientos
          </p>
          <GallerySection />
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="py-16 px-4 bg-sky-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Como llegar</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-left space-y-4">
            <div>
              <p className="font-semibold text-slate-700">Direccion</p>
              <p className="text-slate-500">{ci.address}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Telefono</p>
              <p className="text-slate-500">{ci.phone}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Email</p>
              <p className="text-slate-500">{ci.email}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Horario</p>
              <p className="text-slate-500">{formatSchedule(ci)}</p>
            </div>
          </div>
          <div className="mt-8">
            <Link href="/agendar" className="btn-primary px-8 py-3 text-lg">
              Agendar mi cita
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-8 px-4 text-center">
        <p className="text-white font-semibold text-lg mb-1">{clinicName}</p>
        <p className="text-sm">{ci.phone} · {ci.email}</p>
        <p className="text-sm mt-2">{ci.address}</p>
        <p className="text-xs mt-4 text-slate-600">
          © {new Date().getFullYear()} Todos los derechos reservados
        </p>
      </footer>
    </main>
  )
}
