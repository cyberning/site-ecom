import HeroBanner from "@/components/storefront/HeroBanner";
import TrustBadges from "@/components/storefront/TrustBadges";
import ProductGrid from "@/components/storefront/ProductGrid";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const tCommon = await getTranslations("common");

  return (
    <>
      <HeroBanner />
      <TrustBadges />
      <section id="products" className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-8 text-2xl font-bold text-[var(--text-primary)]">
          {tCommon("products")}
        </h2>
        <ProductGrid />
      </section>
    </>
  );
}
