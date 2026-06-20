import { Suspense } from 'react'
import Link from 'next/link'

import { getSessionProfile } from '@/lib/session'
import NavbarClient from './NavbarClient'

// Server entry point. The auth-dependent read lives inside <Suspense> so the
// route still prerenders its static shell under Cache Components; the
// personalized nav streams in. Call sites just render <Navbar/>.
export default function Navbar() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarAuth />
    </Suspense>
  )
}

async function NavbarAuth() {
  const { user, role } = await getSessionProfile()
  return <NavbarClient userPresent={!!user} role={role} />
}

// Visually-identical static frame (logo + public links). The auth slot shows a
// neutral placeholder rather than guessing logged-in/out, so nothing flickers
// from wrong content to right content when the real nav streams in.
function NavbarFallback() {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-sky-700 text-lg">
            🦷 <span className="hidden sm:inline">Consultorio Molina</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/#servicios" className="hover:text-sky-600 transition-colors">Servicios</Link>
            <Link href="/#galeria" className="hover:text-sky-600 transition-colors">Galería</Link>
            <Link href="/#contacto" className="hover:text-sky-600 transition-colors">Contacto</Link>
            <Link href="/agendar" className="hover:text-sky-600 transition-colors">Agendar</Link>
            <div className="h-8 w-28 rounded-lg bg-slate-100 animate-pulse" aria-hidden="true" />
          </div>
          <div className="md:hidden h-8 w-8 rounded bg-slate-100 animate-pulse" aria-hidden="true" />
        </div>
      </div>
    </nav>
  )
}
