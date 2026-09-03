"use client";

import { useEffect } from "react";
import { usePixel } from "@/providers/PixelProvider";

interface ProductViewTrackerProps {
  productName: string;
  productSlug: string;
  price: number;
}

export default function ProductViewTracker({ productName, productSlug, price }: ProductViewTrackerProps) {
  const { trackEvent } = usePixel();

  useEffect(() => {
    trackEvent("ViewContent", {
      content_name: productName,
      content_type: "product",
      content_ids: [productSlug],
      value: price,
      currency: "DZD",
    });
  }, [productName, productSlug, price, trackEvent]);

  return null;
}
