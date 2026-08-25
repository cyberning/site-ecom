"use client";

import { useSession } from "@/hooks/useSession";
import Link from "next/link";

const stats = [
  { name: "Produits", value: "0", icon: "📦", color: "text-blue-500" },
  { name: "Commandes", value: "0", icon: "📋", color: "text-green-500" },
  { name: "En attente", value: "0", icon: "⏳", color: "text-yellow-500" },
  { name: "Chiffre d'affaires", value: "0 DA", icon: "💰", color: "text-[var(--accent)]" },
];

export default function AdminDashboard() {
  const { session } = useSession();

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Bonjour, {session?.user?.name || "Admin"} 👋
        </h2>
        <p className="mt-1 text-[var(--text-secondary)]">Voici un résumé de votre boutique</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-neumorphic)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl" aria-hidden="true">
                {stat.icon}
              </span>
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Actions rapides</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products"
            className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-[var(--transition)] hover:bg-[var(--accent-hover)]"
          >
            + Nouveau produit
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-[var(--transition)] hover:bg-[var(--bg-secondary)]"
          >
            Voir les commandes
          </Link>
          <Link
            href="/admin/delivery"
            className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-[var(--transition)] hover:bg-[var(--bg-secondary)]"
          >
            Configurer la livraison
          </Link>
        </div>
      </div>
    </div>
  );
}
