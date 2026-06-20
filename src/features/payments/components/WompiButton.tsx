"use client";

import { useState } from "react";

import { startAppointmentCheckout } from "@/app/pagos/actions";

interface WompiButtonProps {
  appointmentId: string;
  label?: string;
}

export default function WompiButton({
  appointmentId,
  label,
}: WompiButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    setLoading(true);
    setError("");

    // The amount, reference, signature and keys are all decided on the server
    // inside the action — the client only receives the final checkout URL.
    const result = await startAppointmentCheckout(appointmentId);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    window.location.href = result.url;
  };

  return (
    <div>
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FF5B30] px-6 py-4 font-bold text-lg text-white shadow-md transition-all hover:bg-[#e04e26] disabled:opacity-60"
      >
        {loading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />{" "}
            Conectando con Wompi...
          </>
        ) : (
          `💳 ${label ?? "Pagar con Wompi"}`
        )}
      </button>
      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
