import { Suspense } from "react";
import Link from "next/link";

import Navbar from "@/features/navigation/components/Navbar";
import WompiButton from "@/features/payments/components/WompiButton";
import {
  confirmAppointmentByTransaction,
  type ReconcileOutcome,
} from "@/lib/wompi";

type View = "approved" | "pending" | "declined" | "unverified";

function toView(outcome: ReconcileOutcome): View {
  if (outcome === "approved") return "approved";
  if (outcome === "pending") return "pending";
  if (outcome === "declined") return "declined";
  return "unverified"; // amount_mismatch | not_found | error
}

export default function ResultadoPagoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <main className="min-h-screen bg-sky-50">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex items-center justify-center px-4 py-20">
            <div className="card w-full max-w-md text-center">
              <div className="mb-4 text-5xl">⏳</div>
              <h2 className="font-bold text-slate-700 text-xl">
                Verificando pago...
              </h2>
              <p className="mt-2 text-slate-400 text-sm">
                Esto toma solo unos segundos
              </p>
            </div>
          </div>
        }
      >
        <Resultado searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Reads runtime search params and reconciles payment server-side. The
// transaction is read from Wompi and reconciled against the DB entirely on the
// server (amount verified against the service price). The browser never decides
// whether the appointment is paid. The dynamic read lives behind <Suspense>, so
// the page stays dynamic without a route segment config (Cache Components).
async function Resultado({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawId = params.id;
  const transactionId = Array.isArray(rawId) ? rawId[0] : rawId;

  const result = transactionId
    ? await confirmAppointmentByTransaction(transactionId)
    : null;

  const view: View = result ? toView(result.outcome) : "unverified";
  const transaction = result?.transaction ?? null;
  const appointmentId = result?.appointmentId ?? null;

  return (
    <div className="flex items-center justify-center px-4 py-20">
      <div className="card w-full max-w-md text-center">
        {view === "approved" && (
          <>
            <div className="mb-4 text-6xl">✅</div>
            <h2 className="mb-2 font-bold text-2xl text-green-600">
              ¡Pago exitoso!
            </h2>
            <p className="mb-1 text-slate-600">
              Tu cita ha sido confirmada y pagada.
            </p>
            {transaction && (
              <div className="my-4 space-y-1 rounded-xl border border-green-100 bg-green-50 p-4 text-left">
                <p className="text-slate-600 text-sm">
                  <strong>Referencia:</strong> {transaction.reference}
                </p>
                {transaction.amountInCents !== undefined && (
                  <p className="text-slate-600 text-sm">
                    <strong>Valor:</strong> $
                    {(transaction.amountInCents / 100).toLocaleString("es-CO")}{" "}
                    COP
                  </p>
                )}
                <p className="text-slate-600 text-sm">
                  <strong>ID transacción:</strong> {transaction.id}
                </p>
              </div>
            )}
            <Link href="/mis-citas" className="btn-primary mt-4 block w-full">
              Ver mis citas
            </Link>
          </>
        )}

        {view === "pending" && (
          <>
            <div className="mb-4 text-6xl">🕐</div>
            <h2 className="mb-2 font-bold text-2xl text-yellow-600">
              Pago en proceso
            </h2>
            <p className="mb-4 text-slate-500">
              El pago está siendo procesado. Te confirmaremos tu cita en cuanto
              se acredite.
            </p>
            <Link href="/mis-citas" className="btn-primary block w-full">
              Ver mis citas
            </Link>
          </>
        )}

        {view === "declined" && (
          <>
            <div className="mb-4 text-6xl">❌</div>
            <h2 className="mb-2 font-bold text-2xl text-red-600">
              Pago rechazado
            </h2>
            <p className="mb-4 text-slate-500">
              El pago no pudo procesarse. Tu cita sigue reservada — puedes
              reintentar el pago o volver al inicio.
            </p>
            {appointmentId ? (
              <div className="space-y-3">
                <WompiButton
                  appointmentId={appointmentId}
                  label="Reintentar pago"
                />
                <Link
                  href="/"
                  className="btn-secondary block w-full text-center"
                >
                  Ir al inicio
                </Link>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/agendar"
                  className="btn-secondary flex-1 text-center"
                >
                  Agendar de nuevo
                </Link>
                <Link href="/" className="btn-primary flex-1 text-center">
                  Ir al inicio
                </Link>
              </div>
            )}
          </>
        )}

        {view === "unverified" && (
          <>
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="mb-2 font-bold text-2xl text-slate-700">
              No pudimos verificar tu pago
            </h2>
            <p className="mb-4 text-slate-500">
              Si se realizó un cobro, no fue posible asociarlo a tu cita. Por
              favor contáctanos para revisarlo.
            </p>
            <Link href="/mis-citas" className="btn-primary block w-full">
              Ver mis citas
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
