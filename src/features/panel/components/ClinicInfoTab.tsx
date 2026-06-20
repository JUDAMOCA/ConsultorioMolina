'use client'

import { useRef, useState, useTransition, type ChangeEvent } from 'react'

import { saveBanner, saveClinicInfo, uploadImage } from '@/features/panel/actions'
import { DAY_NAMES_FULL } from '@/features/panel/lib/calendar'
import type { PanelClinicInfo } from '@/features/panel/lib/types'

const featureKey = (n: number, kind: 'title' | 'desc') =>
  `feature_${n}_${kind}` as keyof PanelClinicInfo

export default function ClinicInfoTab({ clinicInfo }: { clinicInfo: PanelClinicInfo | null }) {
  // Controlled local copy seeded from the server — required for the live banner
  // / colour / day previews. Re-deriving from the prop on every revalidation
  // would discard the dentist's unsaved edits, so the local copy is the source
  // of truth until "Guardar". Writes go through server actions.
  // react-doctor-disable-next-line react-doctor/no-derived-useState
  const [info, setInfo] = useState<PanelClinicInfo | null>(clinicInfo)
  const [msg, setMsg] = useState('')
  const [savePending, startSave] = useTransition()
  const [bannerPending, startBanner] = useTransition()
  const [logoPending, startLogo] = useTransition()
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  if (!info) {
    return <div className="card text-center py-12 text-slate-400 max-w-2xl">No se pudo cargar la información del consultorio.</div>
  }

  const toggleDay = (d: number) => {
    const current = info.working_days ?? [1, 2, 3, 4, 5]
    const working_days = current.includes(d) ? current.filter((x) => x !== d) : [...current, d].sort()
    setInfo({ ...info, working_days })
  }

  const onBannerPick = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    startBanner(async () => {
      // Upload the picked files concurrently, preserving their order.
      const results = await Promise.all(
        files.map((file) => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('folder', 'banners')
          return uploadImage(formData)
        })
      )
      const urls = results.flatMap((res) => ('error' in res ? [] : [res.url]))
      if (urls.length < files.length) alert('Algunas imágenes no se pudieron subir.')
      if (!urls.length) return
      const banner_images = [...(info.banner_images ?? []), ...urls]
      setInfo({ ...info, banner_type: 'slider', banner_images })
      const saved = await saveBanner(info.id, banner_images)
      if ('error' in saved) alert(saved.error)
    })
  }

  const removeBanner = (url: string) => {
    const banner_images = info.banner_images.filter((u) => u !== url)
    setInfo({ ...info, banner_images })
    startBanner(async () => {
      const saved = await saveBanner(info.id, banner_images)
      if ('error' in saved) alert(saved.error)
    })
  }

  const onLogoPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    startLogo(async () => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'logos')
      const res = await uploadImage(formData)
      if ('error' in res) { alert('Error al subir logo: ' + res.error); return }
      setInfo({ ...info, logo_url: res.url })
    })
  }

  const save = () => {
    startSave(async () => {
      const res = await saveClinicInfo(info)
      setMsg('error' in res ? '❌ Error al guardar: ' + res.error : '✅ ¡Guardado correctamente!')
      setTimeout(() => setMsg(''), 4000)
    })
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">🏥 Información del consultorio</h2>
        <p className="text-slate-500 text-sm mt-1">Esta información se muestra en la página de inicio y afecta los horarios de citas</p>
      </div>

      <div className="space-y-6">
        {/* Banner del hero */}
        <div className="card">
          <h3 className="font-bold text-slate-700 mb-4">🖼️ Banner principal (hero)</h3>

          <div className="flex gap-2 mb-5">
            {([
              { key: 'gradient', label: '🎨 Gradiente' },
              { key: 'color', label: '🟦 Color sólido' },
              { key: 'slider', label: '🖼️ Fotos' },
            ] as const).map(({ key, label }) => (
              <button key={key} type="button"
                onClick={() => setInfo({ ...info, banner_type: key })}
                className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${info.banner_type === key ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="rounded-xl overflow-hidden mb-4 h-24 w-full relative"
            style={info.banner_type === 'gradient'
              ? { background: `linear-gradient(135deg, ${info.banner_color_from ?? '#0284c7'}, ${info.banner_color_to ?? '#06b6d4'})` }
              : info.banner_type === 'color'
                ? { background: info.banner_color_from ?? '#0284c7' }
                : {}}>
            {info.banner_type === 'slider' && (info.banner_images ?? []).length > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.banner_images[0]} alt="Preview" className="w-full h-full object-cover" />
            )}
            {info.banner_type === 'slider' && (info.banner_images ?? []).length === 0 && (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-sm">Sin fotos aún</div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm opacity-60">Vista previa</span>
            </div>
          </div>

          {(info.banner_type === 'gradient' || info.banner_type === 'color') && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="label" htmlFor="banner-color-from">{info.banner_type === 'gradient' ? 'Color inicial' : 'Color de fondo'}</label>
                <div className="flex items-center gap-2">
                  <input id="banner-color-from" type="color" aria-label="Selector de color de fondo" className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    value={info.banner_color_from ?? '#0284c7'}
                    onChange={(e) => setInfo({ ...info, banner_color_from: e.target.value })} />
                  <input className="input flex-1" aria-label="Color de fondo en hexadecimal" value={info.banner_color_from ?? '#0284c7'}
                    onChange={(e) => setInfo({ ...info, banner_color_from: e.target.value })} />
                </div>
              </div>
              {info.banner_type === 'gradient' && (
                <div className="flex-1">
                  <label className="label" htmlFor="banner-color-to">Color final</label>
                  <div className="flex items-center gap-2">
                    <input id="banner-color-to" type="color" aria-label="Selector de color final" className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                      value={info.banner_color_to ?? '#06b6d4'}
                      onChange={(e) => setInfo({ ...info, banner_color_to: e.target.value })} />
                    <input className="input flex-1" aria-label="Color final en hexadecimal" value={info.banner_color_to ?? '#06b6d4'}
                      onChange={(e) => setInfo({ ...info, banner_color_to: e.target.value })} />
                  </div>
                </div>
              )}
            </div>
          )}

          {info.banner_type === 'slider' && (
            <div>
              <input type="file" ref={bannerRef} className="hidden" accept="image/*" multiple aria-label="Agregar fotos al banner" onChange={onBannerPick} />
              <button type="button" onClick={() => bannerRef.current?.click()} disabled={bannerPending}
                className="btn-secondary text-sm mb-4">
                {bannerPending ? '⬆️ Subiendo...' : '⬆️ Agregar fotos al banner'}
              </button>
              <p className="text-xs text-slate-400 mb-3">Puedes subir varias fotos. Pasarán automáticamente cada 4 segundos.</p>
              {(info.banner_images ?? []).length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {info.banner_images.map((url, i) => (
                    <div key={url} className="relative group rounded-xl overflow-hidden" style={{ aspectRatio: '16/5' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Banner ${i + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeBanner(url)}
                        className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Quitar foto">
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
              <label className="label" htmlFor="clinic-name">Nombre del consultorio</label>
              <input id="clinic-name" className="input" value={info.clinic_name ?? ''}
                onChange={(e) => setInfo({ ...info, clinic_name: e.target.value })}
                placeholder="Consultorio Juan Carlos Molina" />
            </div>
            <div>
              <label className="label" htmlFor="banner-subtitle">Subtitulo del banner</label>
              <textarea id="banner-subtitle" className="input resize-none" rows={2}
                value={info.banner_subtitle ?? ''}
                onChange={(e) => setInfo({ ...info, banner_subtitle: e.target.value })}
                placeholder="Tu salud dental en manos expertas." />
            </div>
            <div>
              <label className="label" htmlFor="logo-input">Logo</label>
              <div className="flex items-center gap-4">
                {info.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={info.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1" />
                )}
                <div>
                  <input id="logo-input" type="file" ref={logoRef} className="hidden" accept="image/*" aria-label="Subir logo" onChange={onLogoPick} />
                  <button type="button" onClick={() => logoRef.current?.click()} disabled={logoPending}
                    className="btn-secondary text-sm py-2">
                    {logoPending ? 'Subiendo...' : info.logo_url ? '🔄 Cambiar logo' : '⬆️ Subir logo'}
                  </button>
                  {info.logo_url && (
                    <button type="button" onClick={() => setInfo({ ...info, logo_url: null })}
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
                <input className="input" placeholder="Título" aria-label={`Título característica ${n}`}
                  value={(info[featureKey(n, 'title')] as string) ?? ''}
                  onChange={(e) => setInfo({ ...info, [featureKey(n, 'title')]: e.target.value } as Partial<PanelClinicInfo> as PanelClinicInfo)} />
                <textarea className="input resize-none h-16" placeholder="Descripción" aria-label={`Descripción característica ${n}`}
                  value={(info[featureKey(n, 'desc')] as string) ?? ''}
                  onChange={(e) => setInfo({ ...info, [featureKey(n, 'desc')]: e.target.value } as Partial<PanelClinicInfo> as PanelClinicInfo)} />
              </div>
            ))}
          </div>
        </div>

        {/* Datos de contacto */}
        <div className="card">
          <h3 className="font-bold text-slate-700 mb-4">📋 Datos de contacto</h3>
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="clinic-address">Dirección</label>
              <input id="clinic-address" className="input" value={info.address}
                onChange={(e) => setInfo({ ...info, address: e.target.value })}
                placeholder="Calle 123 # 45-67, Bogotá" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="clinic-phone">Teléfono</label>
                <input id="clinic-phone" className="input" value={info.phone}
                  onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                  placeholder="+57 300 000 0000" />
              </div>
              <div>
                <label className="label" htmlFor="clinic-email">Email</label>
                <input id="clinic-email" type="email" className="input" value={info.email}
                  onChange={(e) => setInfo({ ...info, email: e.target.value })}
                  placeholder="contacto@consultorio.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Días laborales */}
        <div className="card">
          <h3 className="font-bold text-slate-700 mb-4">📅 Días de atención</h3>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <button key={d} type="button" onClick={() => toggleDay(d)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${(info.working_days ?? [1, 2, 3, 4, 5]).includes(d) ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
                {DAY_NAMES_FULL[d].slice(0, 3)}
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
                  <label className="label" htmlFor="morning-start">Inicio</label>
                  <input id="morning-start" type="time" className="input" value={info.morning_start}
                    onChange={(e) => setInfo({ ...info, morning_start: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="morning-end">Fin</label>
                  <input id="morning-end" type="time" className="input" value={info.morning_end}
                    onChange={(e) => setInfo({ ...info, morning_end: e.target.value })} />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Jornada tarde</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="afternoon-start">Inicio</label>
                  <input id="afternoon-start" type="time" className="input" value={info.afternoon_start}
                    onChange={(e) => setInfo({ ...info, afternoon_start: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="afternoon-end">Fin</label>
                  <input id="afternoon-end" type="time" className="input" value={info.afternoon_end}
                    onChange={(e) => setInfo({ ...info, afternoon_end: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-sm text-sky-700">
            💡 Los cambios de horario se reflejan automáticamente al agendar nuevas citas.
          </div>
        </div>

        {msg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-medium">{msg}</div>}

        <button type="button" onClick={save} disabled={savePending} className="btn-primary w-full py-3">
          {savePending ? 'Guardando...' : '💾 Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
