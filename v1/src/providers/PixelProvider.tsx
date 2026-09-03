"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { trackClientEvent } from "@/components/storefront/PixelScripts";

interface PixelContextType {
  /**
   * Send a client-side tracking event to all loaded pixel SDKs.
   *
   * Common events:
   * - "PageView" — fired automatically on route changes
   * - "ViewContent" — when a product page is viewed
   * - "InitiateCheckout" — when the checkout form is submitted
   * - "Purchase" — on the thank-you page after order confirmation
   * - "AddToCart" — when a product is added to cart (if applicable)
   */
  trackEvent: (eventName: string, params?: Record<string, unknown>) => void;
}

const PixelContext = createContext<PixelContextType>({
  trackEvent: () => {},
});

/**
 * Hook to send tracking events from any storefront client component.
 *
 * @example
 * const { trackEvent } = usePixel();
 * trackEvent("ViewContent", { content_name: "Product Name", value: 2490 });
 */
export function usePixel() {
  return useContext(PixelContext);
}

interface PixelProviderProps {
  children: ReactNode;
}

export default function PixelProvider({ children }: PixelProviderProps) {
  const trackEvent = useCallback(
    (eventName: string, params?: Record<string, unknown>) => {
      trackClientEvent(eventName, params);
    },
    []
  );

  return <PixelContext.Provider value={{ trackEvent }}>{children}</PixelContext.Provider>;
}
