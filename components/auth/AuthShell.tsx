import Link from "next/link";

/** Giriş, kayıt ve hesap kurtarma sayfalarının ortak çerçevesi: logo, başlık ve açıklama. */
export default function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-6 px-6 py-10">
      <header className="text-center">
        <Link href="/" className="text-3xl font-extrabold tracking-tight">
          Neresi <span className="text-accent">Burası?</span>
        </Link>
        <h1 className="mt-6 text-xl font-bold">{title}</h1>
        {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
      </header>
      {children}
    </main>
  );
}

export const inputClass =
  "min-h-11 rounded-xl border border-line bg-surface-2 px-3 text-ink placeholder:text-muted focus:border-accent focus:outline-none";

export const primaryButtonClass =
  "min-h-11 rounded-xl bg-accent px-4 font-semibold text-accent-ink transition hover:bg-accent-strong disabled:bg-surface-2 disabled:text-muted";
