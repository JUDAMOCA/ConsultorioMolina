"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { canCancel } from "@/features/appointments/lib/status";

export type CancelResult = { ok: true } | { error: string };

// Server-authoritative cancellation: ownership and the >1h window are enforced
// here, not just hidden in the UI. The browser can no longer flip another
// patient's appointment or bypass the window.
export async function cancelAppointment(id: string): Promise<CancelResult> {
  if (!id) return { error: "Cita no especificada." };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, patient_id, status, appointment_date, start_time")
    .eq("id", id)
    .maybeSingle();

  if (!appt || appt.patient_id !== user.id)
    return { error: "Cita no encontrada." };
  if (appt.status === "cancelled")
    return { error: "La cita ya está cancelada." };
  if (!canCancel(appt))
    return { error: "Solo puedes cancelar con más de 1 hora de anticipación." };

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return { error: "No se pudo cancelar la cita. Intenta de nuevo." };

  revalidatePath("/mis-citas");
  return { ok: true };
}
