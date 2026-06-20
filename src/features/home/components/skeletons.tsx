// Static streaming fallbacks for the homepage sections. Pure presentational —
// no data, no client code.

export function HeroSkeleton() {
  return (
    <>
      <div className="h-[520px] animate-pulse bg-gradient-to-br from-sky-600 to-cyan-400" />
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      </div>
    </>
  );
}

export function ServicesSkeleton() {
  return (
    <section className="bg-sky-50 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto mb-3 h-9 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mx-auto mb-10 h-5 w-80 animate-pulse rounded bg-slate-100" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="aspect-square animate-pulse rounded-2xl bg-slate-100"
        />
      ))}
    </div>
  );
}
