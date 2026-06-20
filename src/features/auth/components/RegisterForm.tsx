'use client'

import { useActionState } from 'react'

import { signUp, type AuthState } from '@/features/auth/actions'

// Interactive island only: collects the new patient's details and shows the
// server action's validation result. Account creation, the profile row and the
// `role` assignment all happen server-side in `signUp`.
export default function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, null)

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="label" htmlFor="fullName">Nombre completo</label>
        <input id="fullName" name="fullName" type="text" autoComplete="name" className="input" placeholder="Juan Pérez" required />
      </div>

      <div>
        <label className="label" htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" placeholder="tucorreo@ejemplo.com" required />
      </div>

      <div>
        <label className="label" htmlFor="phone">Teléfono <span className="text-red-500">*</span></label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" className="input" placeholder="+57 300 000 0000" required />
        <p className="text-xs text-slate-400 mt-1">Necesario para confirmar tu cita</p>
      </div>

      <div>
        <label className="label" htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} className="input" placeholder="Mínimo 6 caracteres" required />
      </div>

      <div>
        <label className="label" htmlFor="confirm">Confirmar contraseña</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={6} className="input" placeholder="Repite tu contraseña" required />
      </div>

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3" role="alert">
          {state.error}
        </div>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  )
}
