"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PixelConfig {
  id: string;
  name: string;
  type: string; // "META" | "TIKTOK" | "GOOGLE"
  pixelId: string;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Global pixel state (singleton across re-renders)
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: Record<string, unknown>;
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void };
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

let loadedPixels: PixelConfig[] = [];
let pixelsFetched = false;

// ---------------------------------------------------------------------------
// SDK initializers
// ---------------------------------------------------------------------------

function initMetaPixel(pixelId: string) {
  // Meta Pixel base code — the IIFE is idempotent (has its own fbq guard)
  const script = document.createElement("script");
  script.innerHTML = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
  `;
  document.head.appendChild(script);
  // The IIFE above defines window.fbq synchronously
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).fbq?.("init", pixelId);
}

function initTikTokPixel(pixelId: string) {
  if (window.ttq) return;
  const script = document.createElement("script");
  script.innerHTML = `
    !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e+""]=+new Date,ttq._o=ttq._o||{},ttq._o[e+""]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)};
    ttq.load('${pixelId}');
    ttq.page();
  `;
  document.head.appendChild(script);
}

function initGoogleTag(conversionId: string) {
  if (window.gtag) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=AW-${conversionId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag?.("js", new Date());
  window.gtag?.("config", `AW-${conversionId}`);
}

// ---------------------------------------------------------------------------
// Event tracking functions (client-side)
// ---------------------------------------------------------------------------

function trackMetaEvent(eventName: string, params?: Record<string, unknown>) {
  if (window.fbq) {
    window.fbq("track", eventName, params);
  }
}

function trackTikTokEvent(eventName: string, params?: Record<string, unknown>) {
  if (window.ttq) {
    window.ttq.track(eventName, params);
  }
}

function trackGoogleEvent(eventName: string, params?: Record<string, unknown>) {
  if (window.gtag) {
    window.gtag("event", eventName, params);
  }
}

/**
 * Fire an event to all loaded client-side pixels.
 */
export function trackClientEvent(eventName: string, params?: Record<string, unknown>) {
  for (const pixel of loadedPixels) {
    switch (pixel.type) {
      case "META":
        trackMetaEvent(eventName, params);
        break;
      case "TIKTOK":
        // TikTok uses different event names
        trackTikTokEvent(eventName === "PageView" ? "page" : eventName, params);
        break;
      case "GOOGLE":
        trackGoogleEvent(eventName, params);
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Component: loads SDKs + fires PageView on route change
// ---------------------------------------------------------------------------

export default function PixelScripts() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string>("");

  // Fetch pixel configs and load SDKs
  useEffect(() => {
    if (pixelsFetched) return;

    fetch("/api/admin/pixels")
      .then((res) => res.json())
      .then((data: { pixels?: PixelConfig[] }) => {
        const active = (data.pixels || []).filter((p) => p.isActive);
        loadedPixels = active;
        pixelsFetched = true;

        for (const pixel of active) {
          switch (pixel.type) {
            case "META":
              initMetaPixel(pixel.pixelId);
              break;
            case "TIKTOK":
              initTikTokPixel(pixel.pixelId);
              break;
            case "GOOGLE":
              initGoogleTag(pixel.pixelId);
              break;
          }
        }
      })
      .catch(() => {
        // Silent fail — pixel loading is non-blocking
      });
  }, []);

  // Fire PageView on route change
  useEffect(() => {
    const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    if (fullPath === lastPathRef.current) return;
    lastPathRef.current = fullPath;

    // Debounce: small delay to avoid duplicate fires
    const timer = setTimeout(() => {
      trackClientEvent("PageView", { page_path: fullPath });
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null; // No visual output
}
