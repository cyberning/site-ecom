import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "E-Commerce DZ",
    template: "%s | E-Commerce DZ",
  },
  description: "Boutique en ligne — livraison rapide dans toute l'Algérie",
};

// Root layout: minimal. The actual <html>/<body> with lang & dir are
// rendered by the [locale] layout so that RTL (ar) is handled correctly.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
