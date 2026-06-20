"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";

import { cancelAppointment } from "@/features/appointments/actions";
import {
  canCancel,
  isPast,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/features/appointments/lib/status";
import type { PatientAppointment } from "@/features/appointments/data";

export default function CitasView({
  appointments,
}: {
  appointments: PatientAppointment[];
}) {
  // Optimistically move the cancelled appointment to "historial" instantly; the
  // server action revalidates the page and `appointments` settles to truth.
  const [view, applyCancel] = useOptimistic(appointments, (state, id: string) =>
    state.map((a) =>
      a.id === id ? { ...a, status: "cancelled" as const } : a,
    ),
  );
  const [, startTransition] = useTransition();

  const handleCancel = (id: string) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;
    startTransition(async () => {
      applyCancel(id);
      const result = await cancelAppointment(id);
      if ("error" in result) alert(result.error);
    });
  };

  const upcoming = view.filter((a) => !isPast(a));
  const past = view.filter(isPast);

  if (view.length === 0) {
    return (
      <div className="card py-16 text-center">
        <div className="mb-4 text-5xl">📭</div>
        <p className="mb-4 text-slate-500">No tienes citas agendadas aún.</p>
        <Link href="/agendar" className="btn-primary">
          Agendar mi primera cita
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Próximas */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="mb-3 font-bold text-lg text-slate-700">
            Próximas citas
          </h2>
          <div className="space-y-4">
            {upcoming.map((appt) => (
              <div key={appt.id} className="card">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 font-medium text-xs ${STATUS_COLORS[appt.status]}`}
                      >
                        {STATUS_LABELS[appt.status]}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {appt.payment_method === "cash"
                          ? "💵 Efectivo"
                          : "💳 En línea"}
                      </span>
                    </div>
                    <p className="font-bold text-lg text-slate-800">
                      {appt.services?.name}
                    </p>
                    <p className="font-medium text-sky-600">
                      {new Date(
                        `${appt.appointment_date}T12:00:00`,
                      ).toLocaleDateString("es-CO", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-slate-500 text-sm">
                      🕐 {appt.start_time?.slice(0, 5)} –{" "}
                      {appt.end_time?.slice(0, 5)}
                    </p>
                    {appt.services?.price_cop && (
                      <p className="mt-1 text-slate-400 text-sm">
                        💰 ${appt.services.price_cop.toLocaleString("es-CO")}{" "}
                        COP
                      </p>
                    )}
                  </div>
                  <div>
                    {canCancel(appt) ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(appt.id)}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-600 text-sm transition-all hover:bg-red-100"
                      >
                        Cancelar cita
                      </button>
                    ) : (
                      appt.status !== "cancelled" && (
                        <div className="max-w-[120px] text-center text-slate-400 text-xs">
                          ⚠️ Solo puedes cancelar con más de 1 hora de
                          anticipación
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      {past.length > 0 && (
        <div>
          <h2 className="mb-3 font-bold text-lg text-slate-700">Historial</h2>
          <div className="space-y-3">
            {past.map((appt) => (
              <div key={appt.id} className="card opacity-70">
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      className={`rounded-full px-2 py-1 font-medium text-xs ${STATUS_COLORS[appt.status]}`}
                    >
                      {STATUS_LABELS[appt.status]}
                    </span>
                    <p className="mt-1 font-semibold text-slate-700">
                      {appt.services?.name}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {new Date(
                        `${appt.appointment_date}T12:00:00`,
                      ).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      · {appt.start_time?.slice(0, 5)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
