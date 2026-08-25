"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
      <h1 className="mb-4 text-4xl font-bold text-[var(--text-primary)]">Erreur</h1>
      <p className="mb-2 text-lg text-[var(--text-muted)]">
        Une erreur inattendue s&apos;est produite
      </p>
      {error.digest && <p className="mb-4 text-sm text-[var(--text-muted)]">Réf: {error.digest}</p>}
      <button
        onClick={reset}
        className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-6 py-3 text-white transition-[var(--transition)] hover:opacity-90"
      >
        Réessayer
      </button>
    </div>
  );
}
