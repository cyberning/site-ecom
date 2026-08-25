import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
      <h1 className="mb-4 text-6xl font-bold text-[var(--text-primary)]">404</h1>
      <p className="mb-8 text-lg text-[var(--text-muted)]">Page non trouvée</p>
      <Link
        href="/"
        className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-6 py-3 text-white transition-[var(--transition)] hover:opacity-90"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
