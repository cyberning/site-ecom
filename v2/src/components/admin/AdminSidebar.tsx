"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  Palette,
  LogOut,
  Menu,
  X,
  Store,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", key: "orders", icon: ShoppingCart },
  { href: "/admin/products", key: "products", icon: Package },
  { href: "/admin/settings", key: "settings", icon: Settings },
  { href: "/admin/theme", key: "theme", icon: Palette },
] as const;

export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label={t("adminPanel")}>
      {NAV_ITEMS.map(({ href, key, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
            isActive(href)
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]"
          )}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{t(key)}</span>
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-3">
      <Link
        href="/"
        className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <Store className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{t("backToStore")}</span>
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{t("logout")}</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile topbar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 lg:hidden">
        <span className="flex items-center gap-2 font-heading text-base font-bold text-[var(--text-primary)]">
          <Store className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          {t("adminPanel")}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t("cancel") : t("adminPanel")}
          aria-expanded={open}
          className="rounded-[var(--radius-md)] p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-input)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {open ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 start-0 flex w-64 flex-col gap-4 bg-[var(--bg-secondary)] p-4 shadow-[var(--shadow-lg)]">
            <span className="flex items-center gap-2 px-3 font-heading text-base font-bold text-[var(--text-primary)]">
              <Store className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              {t("adminPanel")}
            </span>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 border-e border-[var(--border)] bg-[var(--bg-secondary)] p-4 lg:flex">
        <span className="flex items-center gap-2 px-3 font-heading text-base font-bold text-[var(--text-primary)]">
          <Store className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          {t("adminPanel")}
        </span>
        {nav}
        {footer}
      </aside>
    </>
  );
}
