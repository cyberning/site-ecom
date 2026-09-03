"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Target,
  Settings,
  Paintbrush,
  User,
  ExternalLink,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation: {
  key: string;
  href: string;
  icon: LucideIcon;
}[] = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "products", href: "/admin/products", icon: Package },
  { key: "orders", href: "/admin/orders", icon: ShoppingCart },
  { key: "delivery", href: "/admin/delivery", icon: Truck },
  { key: "pixels", href: "/admin/pixels", icon: Target },
  { key: "settings", href: "/admin/settings", icon: Settings },
  { key: "customize", href: "/admin/customize", icon: Paintbrush },
  { key: "account", href: "/admin/account", icon: User },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("admin");

  // Fermer la sidebar mobile avec la touche Échap
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [isOpen, onClose]);

  return (
    <>
      {/* ---- Mobile overlay ---- */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ---- Sidebar ---- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--bg-card)] transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label={t("nav.adminNav")}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-5">
          <Link href="/admin" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-sm font-bold text-white transition-transform duration-300 group-hover:scale-110">
              E
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">
              E-Com <span className="text-[var(--accent)]">DZ</span>
            </span>
          </Link>

          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-[var(--transition)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] lg:hidden"
            aria-label={t("nav.closeMenu")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto p-3"
          role="navigation"
          aria-label={t("nav.mainMenu")}
        >
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-[var(--transition)]",
                      isActive
                        ? "border-l-2 border-[var(--accent)] bg-[var(--accent-light)] pl-2.5 text-[var(--accent)]"
                        : "border-l-2 border-transparent text-[var(--text-secondary)] hover:border-[var(--accent)]/30 hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                        isActive
                          ? "text-[var(--accent)]"
                          : "text-[var(--text-muted)] group-hover:text-[var(--accent)]"
                      )}
                    />
                    {t(`nav.${item.key}`)}
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-[var(--border)] p-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-[var(--text-muted)] transition-[var(--transition)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <ExternalLink className="h-[18px] w-[18px]" />
            {t("nav.viewStorefront")}
          </Link>
        </div>
      </aside>
    </>
  );
}
