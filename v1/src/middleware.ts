import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

/**
 * Detect locale from cookie → Accept-Language header → default.
 * The detected locale is persisted in NEXT_LOCALE cookie so that
 * request.ts (server-side) and the root layout can read it.
 */
function detectLocale(request: Request): Locale {
  // 1. Cookie (highest priority — user's explicit choice)
  const cookieMatch = request.headers.get("cookie")?.match(/NEXT_LOCALE=([a-z]{2})/);
  if (cookieMatch && locales.includes(cookieMatch[1] as Locale)) {
    return cookieMatch[1] as Locale;
  }

  // 2. Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(",").map((l) => l.split(";")[0].trim().substring(0, 2));
    for (const lang of preferred) {
      if (locales.includes(lang as Locale)) {
        return lang as Locale;
      }
    }
  }

  return defaultLocale;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // ── Auth: protect admin routes ──────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!isLoggedIn) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === "/admin/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // ── Skip i18n for API routes ────────────────────────────────
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // ── i18n: detect locale and ensure cookie is set ───────────
  const locale = detectLocale(req as unknown as Request);
  const response = NextResponse.next();

  // Expose locale to server components via custom header
  response.headers.set("x-locale", locale);

  // Persist locale cookie if not already set (or differs)
  const existingCookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (existingCookie !== locale) {
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
      sameSite: "lax",
    });
  }

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
});

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next|.*\\..*).*)",
  ],
};
