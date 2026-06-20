import Link from "next/link";

import RegisterForm from "@/features/auth/components/RegisterForm";

// Static server-rendered shell. <RegisterForm/> is the only interactive island;
// it submits to the `signUp` server action which creates the user and profile
// server-side (the client never sets its own `role`).
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 px-4 py-10">
      <div className="card w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-4xl" aria-label="Ir al inicio">
            🦷
          </Link>
          <h1 className="mt-2 font-bold text-2xl text-slate-800">
            Crear cuenta
          </h1>
          <p className="mt-1 text-slate-500 text-sm">
            Regístrate para agendar tus citas
          </p>
        </div>

        <RegisterForm />

        <p className="mt-6 text-center text-slate-500 text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-sky-600 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-slate-400 text-sm hover:text-slate-600"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
