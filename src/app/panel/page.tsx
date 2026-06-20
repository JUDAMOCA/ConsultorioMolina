import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import PanelShell from '@/features/panel/components/PanelShell'
import {
  getEarnings,
  getPanelAppointments,
  getPanelClinicInfo,
  getPanelGallery,
  getPanelServices,
} from '@/features/panel/data'
import { getSessionProfile } from '@/lib/session'

export default function PanelPage() {
  return (
    <Suspense fallback={<PanelLoading />}>
      <PanelGate />
    </Suspense>
  )
}

function PanelLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
      Cargando panel...
    </div>
  )
}

async function PanelGate() {
  const { user, role } = await getSessionProfile()
  if (!user) redirect('/auth/login')
  if (role !== 'dentist') redirect('/')

  // All tab data fetched server-side in parallel — no client fetching, no waterfall.
  const [appointments, services, gallery, clinicInfo, earnings, headerList] = await Promise.all([
    getPanelAppointments(),
    getPanelServices(),
    getPanelGallery(),
    getPanelClinicInfo(),
    getEarnings(),
    headers(),
  ])

  // Prefer the configured site URL; otherwise derive the origin from the request
  // so the QR points at the right host without any client-side window access.
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host')
  const proto = headerList.get('x-forwarded-proto') ?? 'https'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : '')

  return (
    <PanelShell
      appointments={appointments}
      services={services}
      gallery={gallery}
      clinicInfo={clinicInfo}
      earnings={earnings}
      siteUrl={siteUrl}
    />
  )
}
