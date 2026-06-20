import QRCode from "react-qr-code";

// `siteUrl` is resolved server-side (request headers / NEXT_PUBLIC_SITE_URL), so
// this tab is pure presentation — no effect, no window access.
export default function QrTab({ siteUrl }: { siteUrl: string }) {
  return (
    <div className="mx-auto max-w-sm">
      <div className="card text-center">
        <h2 className="mb-2 font-bold text-2xl text-slate-800">📱 Código QR</h2>
        <p className="mb-6 text-slate-500 text-sm">
          Comparte este código para que los pacientes accedan directamente a
          agendar citas
        </p>
        <div className="mb-4 inline-block rounded-2xl border-2 border-slate-100 bg-white p-4">
          {siteUrl ? (
            <QRCode value={`${siteUrl}/agendar`} size={200} />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-sm">
              Configura NEXT_PUBLIC_SITE_URL
            </div>
          )}
        </div>
        <p className="break-all text-slate-400 text-xs">{siteUrl}/agendar</p>
      </div>
    </div>
  );
}
