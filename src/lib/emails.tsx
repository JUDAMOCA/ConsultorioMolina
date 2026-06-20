import type React from "react";
import { Resend } from "resend";

import { AppointmentCreatedEmail } from "@/emails/AppointmentCreatedEmail";
import type { AppointmentCreatedEmailProps } from "@/emails/AppointmentCreatedEmail";
import { AppointmentPaidEmail } from "@/emails/AppointmentPaidEmail";
import type { AppointmentPaidEmailProps } from "@/emails/AppointmentPaidEmail";

// Server-only email helpers. This module uses JSX so it must be .tsx.
// All sends are best-effort: errors are logged but never rethrow so
// they cannot break the appointment or payment flows.

let resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[emails] RESEND_API_KEY not set — skipping email");
    return null;
  }
  if (!resend) resend = new Resend(key);
  return resend;
}

async function send(subject: string, react: React.ReactElement): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("[emails] ADMIN_EMAIL not set — skipping email");
    return;
  }
  const client = getResend();
  if (!client) return;

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  try {
    const { error } = await client.emails.send({
      from,
      to: [adminEmail],
      subject,
      react,
    });
    if (error) console.error("[emails] send error:", error);
  } catch (err) {
    console.error("[emails] exception:", err);
  }
}

export async function sendAppointmentCreatedEmail(
  props: AppointmentCreatedEmailProps,
): Promise<void> {
  await send(
    `Nueva cita agendada — ${props.patientName}`,
    <AppointmentCreatedEmail {...props} />,
  );
}

export async function sendAppointmentPaidEmail(
  props: AppointmentPaidEmailProps,
): Promise<void> {
  await send(
    `Pago confirmado — ${props.patientName}`,
    <AppointmentPaidEmail {...props} />,
  );
}
