import Link from "next/link";

const MAPS = [
  { slug: "world", label: "Dünya" },
  { slug: "turkey", label: "Türkiye" },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">Neresi Burası?</h1>
      <p className="text-slate-600">Bir harita seç:</p>
      {MAPS.map((m) => (
        <Link
          key={m.slug}
          href={`/play/${m.slug}`}
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 font-semibold text-white"
        >
          {m.label}
        </Link>
      ))}
    </main>
  );
}
