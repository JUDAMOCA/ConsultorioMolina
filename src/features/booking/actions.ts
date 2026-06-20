"use server";

import { after } from "next/server";

import { getClinicInfo } from "@/lib/data";
import { sendAppointmentCreatedEmail } from "@/lib/emails";
import { getSessionUser } from "@/lib/session";
import {
  createAdminClient,
  createServerSupabaseClient,
} from "@/lib/supabase-server";
import {
  generateSlots,
  hasConflict,
  minToTime,
  timeToMin,
  type BookedSlot,
} from "./lib/slots";

type CreateResult = { id: string } | { error: string };

// Authoritative availability needs every patient's bookings for the day, not
// just the caller's RLS-scoped rows — read times (no PII) with the service role.
async function bookedSlotsForDate(dateKey: string): Promise<BookedSlot[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("appointments")
    .select("start_time, end_time")
    .eq("appointment_date", dateKey)
    .neq("status", "cancelled");
  return (data ?? []).map((a) => ({
    s: timeToMin(a.start_time),
    e: timeToMin(a.end_time),
  }));
}

async function serviceDuration(serviceId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .maybeSingle();
  return Number(data?.duration_minutes ?? 0);
}

// Live availability for a (service, day). Triggered by the client island on each
// date selection so the grid reflects fresh bookings — without ever opening a
// Supabase client in the browser.
export async function getAvailableSlots(
  serviceId: string,
  dateKey: string,
): Promise<string[]> {
  const user = await getSessionUser();
  if (!user || !serviceId || !dateKey) return [];

  const duration = await serviceDuration(serviceId);
  if (duration <= 0) return [];

  const [clinic, booked] = await Promise.all([
    getClinicInfo(),
    bookedSlotsForDate(dateKey),
  ]);

  return [
    ...generateSlots(
      clinic?.morning_start ?? "08:00",
      clinic?.morning_end ?? "12:00",
      duration,
      booked,
    ),
    ...generateSlots(
      clinic?.afternoon_start ?? "14:00",
      clinic?.afternoon_end ?? "18:00",
      duration,
      booked,
    ),
  ];
}

// Create the appointment. The patient id comes from the session, the duration
// and end time from the DB, and availability is re-checked server-side — none
// of it is trusted from the client.
export async function createAppointment(input: {
  serviceId: string;
  dateKey: string;
  startTime: string;
  paymentMethod: "cash" | "online";
}): Promise<CreateResult> {
  const { serviceId, dateKey, startTime, paymentMethod } = input;
  if (!serviceId || !dateKey || !startTime || !paymentMethod) {
    return { error: "Faltan datos de la cita." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para agendar." };

  const duration = await serviceDuration(serviceId);
  if (duration <= 0) return { error: "El servicio seleccionado no es válido." };

  const startMin = timeToMin(startTime);
  const endMin = startMin + duration;

  const booked = await bookedSlotsForDate(dateKey);
  if (hasConflict(startMin, endMin, booked)) {
    return { error: "Ese horario acaba de ocuparse. Elige otro, por favor." };
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: user.id,
      service_id: serviceId,
      appointment_date: dateKey,
      start_time: `${startTime}:00`,
      end_time: `${minToTime(endMin)}:00`,
      status: "pending",
      payment_method: paymentMethod,
      payment_status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: `No se pudo guardar la cita: ${error?.message ?? "intenta de nuevo"}`,
    };
  }

  const appointmentId = data.id;
  after(async () => {
    const admin = createAdminClient();
    const [profileResult, serviceResult] = await Promise.all([
      admin
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .maybeSingle(),
      admin
        .from("services")
        .select("name, price_cop")
        .eq("id", serviceId)
        .maybeSingle(),
    ]);
    await sendAppointmentCreatedEmail({
      patientName: profileResult.data?.full_name ?? "Paciente",
      patientEmail: profileResult.data?.email ?? "",
      patientPhone: profileResult.data?.phone ?? null,
      serviceName: serviceResult.data?.name ?? "Servicio",
      servicePriceCop: Number(serviceResult.data?.price_cop ?? 0),
      appointmentDate: dateKey,
      startTime,
      paymentMethod,
      appointmentId,
    });
  });

  return { id: appointmentId };
}
