import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { TrackOrder } from "@/components/storefront/TrackOrder";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <div className="h-8 w-48 animate-pulse rounded bg-[var(--bg-input)]" />
        </div>
      }
    >
      <TrackOrder />
    </Suspense>
  );
}
