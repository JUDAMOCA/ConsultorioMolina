import Image from 'next/image'
import Link from 'next/link'

import { getClinicInfo } from '@/lib/data'
import { DEFAULT_CI } from '@/features/home/lib/clinic'
import BannerSlider from './BannerSlider'

export default async function HeroAndFeatures() {
  const ci = (await getClinicInfo()) ?? DEFAULT_CI
  const clinicName = ci.clinic_name || 'Consultorio Juan Carlos Molina'
  const bannerType = ci.banner_type ?? 'gradient'
  const bannerImages = ci.banner_images ?? []
  const colorFrom = ci.banner_color_from ?? '#0284c7'
  const colorTo = ci.banner_color_to ?? '#06b6d4'

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
    <>
      {/* Hero */}
      <section
        className="relative text-white py-24 px-4 overflow-hidden min-h-[340px] flex items-center"
        style={bannerStyle}
      >
        {bannerType === 'slider' && <BannerSlider images={bannerImages} />}

        <div className="relative z-10 max-w-4xl mx-auto text-center w-full">
          {ci.logo_url && (
            <Image
              src={ci.logo_url}
              alt="Logo"
              width={96}
              height={96}
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
    </>
  )
}
