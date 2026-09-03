"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { usePixel } from "@/providers/PixelProvider";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const trackingId = searchParams.get("tracking");
  const { trackEvent } = usePixel();

  useEffect(() => {
    if (trackingId) {
      trackEvent("Purchase", {
        content_type: "product",
      });
    }
  }, [trackingId, trackEvent]);

  if (!trackingId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg text-[var(--text-muted)]">Aucun numéro de suivi trouvé</p>
        <Link href="/" className="mt-4">
          <Button>Retour à l&apos;accueil</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-6xl">✅</div>
      <h1 className="mb-4 text-3xl font-bold text-[var(--text-primary)]">
        Merci pour votre commande !
      </h1>
      <div className="mb-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] px-8 py-4 shadow-[var(--shadow-neumorphic)]">
        <p className="text-sm text-[var(--text-muted)]">Votre numéro de suivi</p>
        <p className="mt-1 font-mono text-2xl font-bold text-[var(--accent)]">{trackingId}</p>
      </div>
      <p className="max-w-md text-[var(--text-secondary)]">
        Votre commande a été enregistrée. Un agent va vous contacter par téléphone pour confirmer.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-[var(--text-muted)]">
        <span>💵 Paiement Cash on Delivery</span>
        <span>🔍 Inspection avant paiement</span>
      </div>
      <Link href="/" className="mt-8">
        <Button variant="secondary">Retour à l&apos;accueil</Button>
      </Link>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-[60vh] items-center justify-center">Chargement...</div>}
    >
      <ThankYouContent />
    </Suspense>
  );
}
