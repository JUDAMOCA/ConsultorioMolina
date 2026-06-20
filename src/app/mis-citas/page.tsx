import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import Navbar from "@/features/navigation/components/Navbar";
import CitasView from "@/features/appointments/components/CitasView";
import { getMyAppointments } from "@/features/appointments/data";
import { getSessionUser } from "@/lib/session";

export default function MisCitasPage() {
  return (
    <main className="min-h-screen bg-sky-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl text-slate-800">📋 Mis citas</h1>
            <p className="mt-1 text-slate-500">
              Historial y próximas citas agendadas
            </p>
          </div>
          <Link href="/agendar" className="btn-primary px-4 py-2 text-sm">
            + Nueva cita
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="card py-12 text-center text-slate-400">
              Cargando...
            </div>
          }
        >
          <CitasList />
        </Suspense>
      </div>
    </main>
  );
}

async function CitasList() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const appointments = await getMyAppointments(user.id);
  return <CitasView appointments={appointments} />;
}
