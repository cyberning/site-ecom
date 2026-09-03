"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { ORDER_STATUSES } from "@/types/admin";

interface OrderFiltersProps {
  currentStatus: string;
  currentSearch: string;
}

export function OrderFilters({
  currentStatus,
  currentSearch,
}: OrderFiltersProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(currentSearch);

  function applyFilters(status: string, term: string) {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.set("status", status);
    if (term) params.set("search", term);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyFilters(currentStatus, search);
          }}
          placeholder={t("searchOrders")}
          aria-label={t("searchOrders")}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] py-2.5 ps-10 pe-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
        />
      </div>

      <select
        value={currentStatus}
        onChange={(e) => applyFilters(e.target.value, search)}
        aria-label={t("status")}
        className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
      >
        <option value="ALL">{t("allStatuses")}</option>
        {ORDER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(status)}
          </option>
        ))}
      </select>
    </div>
  );
}
