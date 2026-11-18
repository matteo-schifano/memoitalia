"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

// Il pagamento con carta è riuscito: solo ora il carrello si svuota.
export default function ClearCart() {
  const { ready, clear } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
