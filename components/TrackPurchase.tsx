"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/tracking";
import type { OrderView } from "@/lib/backend";

// Ordine pagato: evento «Purchase» per Meta e «purchase» per Google Analytics (una volta per ordine).
export default function TrackPurchase({ order }: { order: Pick<OrderView, "number" | "totalCents" | "shippingCents" | "taxCents" | "items"> }) {
  useEffect(() => {
    trackPurchase(order);
  }, [order]);
  return null;
}
