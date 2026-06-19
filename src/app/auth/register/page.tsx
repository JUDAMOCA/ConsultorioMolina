'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!phone.trim()) { setError('El número de teléfono es obligatorio.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }

    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError('Error: ' + signUpError.message); setLoading(false); return }
    if (!data.user) { setError('No se pudo crear el usuario.'); setLoading(false); return }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id, full_name: fullName, email, phone, role: 'patient',
    })
    if (profileError) { setError('Error al guardar perfil: ' + profileError.message); setLoading(false); return }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl">🦷</Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">Crear cuenta</h1>
          <p className="text-slate-500 text-sm mt-1">Regístrate para agendar tus citas</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="label">Nombre completo</label>
            <input type="text" className="input" placeholder="Juan Pérez" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Correo electrónico</label>
            <input type="email" className="input" placeholder="tucorreo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Teléfono <span className="text-red-500">*</span></label>
            <input type="tel" className="input" placeholder="+57 300 000 0000" value={phone} onChange={e => setPhone(e.target.value)} required />
            <p className="text-xs text-slate-400 mt-1">Necesario para confirmar tu cita</p>
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input type="password" className="input" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="label">Confirmar contraseña</label>
            <input type="password" className="input" placeholder="Repite tu contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creando cuenta...' : 'Crear cuenta'}</button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-sky-600 font-semibold hover:underline">Inicia sesión</Link>
        </p>
        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
