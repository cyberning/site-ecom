"use client";

import { useState, useEffect } from "react";

export function useDelivery(
  wilayaCode: string,
  deliveryMode: "HOME" | "STOP_DESK",
  communeName?: string
) {
  const [fee, setFee] = useState(0);
  const [estimatedDays, setEstimatedDays] = useState(2);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wilayaCode) {
      setFee(0);
      return;
    }
    setLoading(true);
    fetch("/api/delivery/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wilayaCode,
        deliveryMode,
        ...(communeName ? { communeName } : {}),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setFee(data.fee || 0);
        setEstimatedDays(data.estimatedDays || 2);
        setLoading(false);
      })
      .catch(() => {
        setFee(0);
        setLoading(false);
      });
  }, [wilayaCode, deliveryMode, communeName]);

  return { fee, estimatedDays, loading };
}
