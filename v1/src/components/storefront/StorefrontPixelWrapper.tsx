"use client";

import PixelProvider from "@/providers/PixelProvider";
import PixelScripts from "@/components/storefront/PixelScripts";

export default function StorefrontPixelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PixelProvider>
      <PixelScripts />
      {children}
    </PixelProvider>
  );
}
