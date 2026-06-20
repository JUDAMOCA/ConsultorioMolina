import QRCode from 'react-qr-code'

// `siteUrl` is resolved server-side (request headers / NEXT_PUBLIC_SITE_URL), so
// this tab is pure presentation — no effect, no window access.
export default function QrTab({ siteUrl }: { siteUrl: string }) {
  return (
    <div className="max-w-sm mx-auto">
      <div className="card text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">📱 Código QR</h2>
        <p className="text-slate-500 text-sm mb-6">Comparte este código para que los pacientes accedan directamente a agendar citas</p>
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 inline-block mb-4">
          {siteUrl ? (
            <QRCode value={`${siteUrl}/agendar`} size={200} />
          ) : (
            <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm">Configura NEXT_PUBLIC_SITE_URL</div>
          )}
        </div>
        <p className="text-xs text-slate-400 break-all">{siteUrl}/agendar</p>
      </div>
    </div>
  )
}
