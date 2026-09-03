import { getTranslations } from "next-intl/server";

export default async function TrustBadges() {
  const t = await getTranslations("homepage");

  const badges = [
    { icon: "💵", title: t("trustCashOnDelivery"), desc: t("trustCashOnDeliveryDesc") },
    { icon: "🔍", title: t("trustInspection"), desc: t("trustInspectionDesc") },
    { icon: "🚚", title: t("trustDelivery"), desc: t("trustDeliveryDesc") },
    { icon: "🛡️", title: t("trustWarranty"), desc: t("trustWarrantyDesc") },
  ];

  return (
    <section className="border-y border-[var(--border)] bg-[var(--bg-card)] py-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
        {badges.map((badge) => (
          <div key={badge.title} className="flex items-center gap-3">
            <span className="text-2xl">{badge.icon}</span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{badge.title}</p>
              <p className="text-xs text-[var(--text-muted)]">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
