"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTransition, useState } from "react";
import { Search } from "lucide-react";
import type { Category } from "@/types/storefront";

interface ProductFiltersProps {
  categories: Category[];
  currentCategory: string;
  currentSearch: string;
}

export function ProductFilters({
  categories,
  currentCategory,
  currentSearch,
}: ProductFiltersProps) {
  const t = useTranslations("products");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);

  function apply(category: string, query: string) {
    const params = new URLSearchParams();
    if (category && category !== "all") params.set("category", category);
    if (query) params.set("search", query);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/products?${qs}` : "/products");
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    apply(currentCategory, search);
  }

  return (
    <div className="mb-8 space-y-4">
      <form onSubmit={handleSearchSubmit} role="search" className="relative">
        <label htmlFor="product-search" className="sr-only">
          {t("search")}
        </label>
        <Search
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <input
          id="product-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-input)] py-2.5 ps-10 pe-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)]"
        />
      </form>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t("categories")}
      >
        <button
          type="button"
          onClick={() => apply("all", search)}
          aria-pressed={currentCategory === "all"}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
            currentCategory === "all"
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]"
          }`}
        >
          {t("all")}
        </button>
        {categories.map((cat) => {
          const active = currentCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => apply(cat.id, search)}
              aria-pressed={active}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                active
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {isPending && (
        <p className="text-sm text-[var(--text-muted)]" role="status">
          {t("loading")}
        </p>
      )}
    </div>
  );
}
