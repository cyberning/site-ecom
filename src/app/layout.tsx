import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import AuthProvider from "@/providers/AuthProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import IntlProvider from "@/providers/IntlProvider";
import { locales, type Locale } from "@/i18n/config";
import "@/styles/themes.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "e-com.dz — E-Commerce COD Algérie",
    template: "%s | e-com.dz",
  },
  description:
    "Boutique en ligne Algérie — Paiement à la livraison — 69 Wilayas — Livraison rapide",
  keywords: [
    "e-commerce",
    "algerie",
    "cod",
    "paiement livraison",
    "boutique en ligne",
    "69 wilayas",
  ],
  authors: [{ name: "e-com.dz" }],
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    siteName: "e-com.dz",
    title: "e-com.dz — E-Commerce COD Algérie",
    description: "Boutique en ligne Algérie — Paiement à la livraison — 69 Wilayas",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Detect locale from cookie (set by middleware or language switcher)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale =
    localeCookie && locales.includes(localeCookie as Locale) ? (localeCookie as Locale) : "fr";
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = document.cookie.split(';').find(function(c) {
                    return c.trim().startsWith('theme=');
                  });
                  if (theme) {
                    document.documentElement.setAttribute('data-theme', theme.split('=')[1]);
                  } else {
                    document.documentElement.setAttribute('data-theme', 'NEUMORPHISM');
                  }
                } catch(e) {
                  document.documentElement.setAttribute('data-theme', 'NEUMORPHISM');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${locale === "ar" ? notoArabic.className : ""}`}>
        <AuthProvider>
          <ThemeProvider>
            <IntlProvider>{children}</IntlProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
