import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset,
} from "react-email";

export interface AppointmentCreatedEmailProps {
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  serviceName: string;
  servicePriceCop: number;
  appointmentDate: string;
  startTime: string;
  paymentMethod: "cash" | "online";
  appointmentId: string;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const str = new Date(y, m - 1, d).toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTime(timeStr: string): string {
  const [h, min] = timeStr.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${min} ${hour >= 12 ? "p.m." : "a.m."}`;
}

function formatCop(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AppointmentCreatedEmail({
  patientName,
  patientEmail,
  patientPhone,
  serviceName,
  servicePriceCop,
  appointmentDate,
  startTime,
  paymentMethod,
  appointmentId,
}: AppointmentCreatedEmailProps) {
  const badgeColor =
    paymentMethod === "cash"
      ? { bg: "#fffbeb", text: "#b45309" }
      : { bg: "#f0f9ff", text: "#0369a1" };
  const badgeLabel =
    paymentMethod === "cash" ? "Pago en efectivo" : "Pago en línea · Wompi";

  return (
    <Html lang="es">
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Head />
        <Body className="bg-slate-50 font-sans">
          <Preview>Nueva cita agendada — {patientName}</Preview>

          {/* Header */}
          <Section
            style={{
              backgroundColor: "#0ea5e9",
              padding: "32px 24px",
              textAlign: "center",
            }}
          >
            <Heading
              as="h1"
              style={{
                color: "#ffffff",
                fontSize: "22px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Consultorio Molina
            </Heading>
            <Text
              style={{
                color: "#e0f2fe",
                fontSize: "13px",
                margin: "4px 0 0 0",
              }}
            >
              Nueva cita agendada
            </Text>
          </Section>

          <Container
            style={{
              maxWidth: "560px",
              margin: "0 auto",
              padding: "24px 16px",
            }}
          >
            <Section
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "32px",
              }}
            >
              {/* Payment method badge */}
              <Section style={{ marginBottom: "24px" }}>
                <Text
                  style={{
                    display: "inline-block",
                    backgroundColor: badgeColor.bg,
                    color: badgeColor.text,
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: "999px",
                    margin: 0,
                  }}
                >
                  {badgeLabel}
                </Text>
              </Section>

              {/* Patient */}
              <Section style={{ marginBottom: "24px" }}>
                <Text
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                    margin: "0 0 6px 0",
                  }}
                >
                  Paciente
                </Text>
                <Text
                  style={{
                    color: "#1e293b",
                    fontSize: "16px",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {patientName}
                </Text>
                <Text
                  style={{
                    color: "#475569",
                    fontSize: "14px",
                    margin: "4px 0 0 0",
                  }}
                >
                  {patientEmail}
                </Text>
                {patientPhone && (
                  <Text
                    style={{
                      color: "#475569",
                      fontSize: "14px",
                      margin: "2px 0 0 0",
                    }}
                  >
                    {patientPhone}
                  </Text>
                )}
              </Section>

              <Hr style={{ borderColor: "#f1f5f9", margin: "0 0 24px 0" }} />

              {/* Appointment details */}
              <Section>
                <Text
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                    margin: "0 0 16px 0",
                  }}
                >
                  Detalles de la cita
                </Text>

                <Section style={{ marginBottom: "12px" }}>
                  <Text
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      margin: "0 0 2px 0",
                    }}
                  >
                    Servicio
                  </Text>
                  <Text
                    style={{
                      fontSize: "15px",
                      color: "#1e293b",
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    {serviceName}
                  </Text>
                </Section>

                <Section style={{ marginBottom: "12px" }}>
                  <Text
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      margin: "0 0 2px 0",
                    }}
                  >
                    Fecha
                  </Text>
                  <Text
                    style={{
                      fontSize: "15px",
                      color: "#1e293b",
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    {formatDate(appointmentDate)}
                  </Text>
                </Section>

                <Section style={{ marginBottom: "12px" }}>
                  <Text
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      margin: "0 0 2px 0",
                    }}
                  >
                    Hora
                  </Text>
                  <Text
                    style={{
                      fontSize: "15px",
                      color: "#1e293b",
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    {formatTime(startTime)}
                  </Text>
                </Section>

                <Section>
                  <Text
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      margin: "0 0 2px 0",
                    }}
                  >
                    Valor del servicio
                  </Text>
                  <Text
                    style={{
                      fontSize: "15px",
                      color: "#1e293b",
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    {formatCop(servicePriceCop)}
                  </Text>
                </Section>
              </Section>

              <Hr style={{ borderColor: "#f1f5f9", margin: "24px 0 16px 0" }} />

              <Text style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
                ID de cita: {appointmentId}
              </Text>
            </Section>
          </Container>

          {/* Footer */}
          <Section style={{ textAlign: "center", padding: "16px 0 32px 0" }}>
            <Text style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
              Consultorio Molina · Notificación automática
            </Text>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  );
}

AppointmentCreatedEmail.PreviewProps = {
  patientName: "María García",
  patientEmail: "maria@example.com",
  patientPhone: "+57 310 123 4567",
  serviceName: "Limpieza dental",
  servicePriceCop: 150000,
  appointmentDate: "2026-06-25",
  startTime: "10:00",
  paymentMethod: "online",
  appointmentId: "abc-123-def-456",
} satisfies AppointmentCreatedEmailProps;

export default AppointmentCreatedEmail;
