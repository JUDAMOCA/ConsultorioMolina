'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (u) {
        const { data } = await supabase.from('profiles').select('role').eq('id', u.id).single()
        setRole(data?.role ?? null)
      }
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setRole(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    router.push('/')
    router.refresh()
  }

  // Si estamos en la homepage usamos anclas (#), si no usamos /#section
  const isHome = pathname === '/'
  const sectionLink = (anchor: string) => isHome ? `#${anchor}` : `/#${anchor}`

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-sky-700 text-lg">
            🦷 <span className="hidden sm:inline">Consultorio Molina</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href={sectionLink('servicios')} className="hover:text-sky-600 transition-colors">Servicios</Link>
            <Link href={sectionLink('galeria')} className="hover:text-sky-600 transition-colors">Galería</Link>
            <Link href={sectionLink('contacto')} className="hover:text-sky-600 transition-colors">Contacto</Link>
            <Link href="/agendar" className="hover:text-sky-600 transition-colors">Agendar</Link>

            {user && role === 'patient' && (
              <Link href="/mis-citas" className="hover:text-sky-600 transition-colors">Mis citas</Link>
            )}
            {user && role === 'dentist' && (
              <Link href="/panel" className="hover:text-sky-600 transition-colors">Panel</Link>
            )}

            {user ? (
              <button onClick={handleSignOut}
                className="text-slate-400 hover:text-red-500 transition-colors">
                Salir
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="hover:text-sky-600 transition-colors">Iniciar sesión</Link>
                <Link href="/auth/register" className="btn-primary text-sm py-1.5 px-4">Registrarse</Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-slate-600" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            {[
              { label: 'Servicios', href: sectionLink('servicios') },
              { label: 'Galería', href: sectionLink('galeria') },
              { label: 'Contacto', href: sectionLink('contacto') },
              { label: 'Agendar cita', href: '/agendar' },
            ].map(item => (
              <Link key={item.label} href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                {item.label}
              </Link>
            ))}

            {user && role === 'patient' && (
              <Link href="/mis-citas" onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                📋 Mis citas
              </Link>
            )}
            {user && role === 'dentist' && (
              <Link href="/panel" onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                🦷 Panel del odontólogo
              </Link>
            )}

            <div className="border-t border-slate-100 mt-2 pt-2">
              {user ? (
                <button onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  Cerrar sesión
                </button>
              ) : (
                <div className="space-y-1">
                  <Link href="/auth/login" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                    Iniciar sesión
                  </Link>
                  <Link href="/auth/register" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sky-600 font-semibold hover:bg-sky-50 rounded-lg transition-colors">
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
