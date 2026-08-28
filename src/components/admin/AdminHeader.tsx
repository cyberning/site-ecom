"use client";

import { useSession } from "@/hooks/useSession";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Palette } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

type ThemeName = "NEUMORPHISM" | "LUXURY" | "VIBRANT" | "ORGANIC" | "TECH";

const themeDots: { name: ThemeName; color: string; label: string }[] = [
  { name: "NEUMORPHISM", color: "#4F46E5", label: "Neumorphism" },
  { name: "LUXURY", color: "#D4AF37", label: "Luxury" },
  { name: "VIBRANT", color: "#CCFF00", label: "Vibrant" },
  { name: "ORGANIC", color: "#6B8E23", label: "Organic" },
  { name: "TECH", color: "#00E5FF", label: "Tech" },
];

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [themeOpen, setThemeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    }
    if (themeOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [themeOpen]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/admin/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] px-4 lg:px-8">
      {/* ---- Left ---- */}
      <div className="flex items-center gap-3">
        {/* Hamburger mobile */}
        <button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] transition-[var(--transition)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Admin Panel</h1>
      </div>

      {/* ---- Right ---- */}
      <div className="flex items-center gap-3">
        {/* Theme switcher dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] transition-[var(--transition)]",
              themeOpen
                ? "bg-[var(--accent-light)] text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            )}
            aria-label="Changer de thème"
            aria-expanded={themeOpen}
            aria-haspopup="true"
          >
            <Palette className="h-[18px] w-[18px]" />
          </button>

          {themeOpen && (
            <div
              className="absolute top-full right-0 z-50 mt-2 w-52 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-lg"
              role="menu"
              aria-label="Sélection de thème"
            >
              <p className="mb-1.5 px-2 text-xs font-medium text-[var(--text-muted)]">Thème</p>
              {themeDots.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    setTheme(t.name);
                    setThemeOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm transition-[var(--transition)]",
                    theme === t.name
                      ? "bg-[var(--accent-light)] text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  )}
                  role="menuitem"
                >
                  <span
                    className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: t.color }}
                    aria-hidden="true"
                  >
                    {theme === t.name && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span>{t.label}</span>
                  {theme === t.name && <span className="ml-auto text-[var(--accent)]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden h-6 w-px bg-[var(--border)] sm:block" />

        {/* User info */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-sm text-[var(--text-secondary)]">
            {session?.user?.name || session?.user?.email}
          </span>
          <span className="rounded-[var(--radius-full)] bg-[var(--accent-light)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
            {session?.user?.role}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm text-[var(--text-muted)] transition-[var(--transition)] hover:bg-red-500/10 hover:text-red-500"
          aria-label="Se déconnecter"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
