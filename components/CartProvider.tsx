"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product, ProductId } from "@/lib/catalog";

type Line = { id: ProductId; qty: number };

type CartCtx = {
  lines: Line[];
  count: number;
  totalCents: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (id: ProductId, qty?: number) => void;
  setQty: (id: ProductId, qty: number) => void;
  bump: number;
  products: Product[];
  checkoutEnabled: boolean;
  /** il carrello salvato è stato letto: prima di allora "vuoto" non vuol dire vuoto */
  ready: boolean;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
// v2: dal 4/11/2026 le barrette sono in box da 12, i carrelli salvati prima contavano barrette singole
const KEY = "memo-cart-v2";

export function CartProvider({ children, products, checkoutEnabled }: { children: React.ReactNode; products: Product[]; checkoutEnabled: boolean }) {
  const [savedLines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    // non scrive prima di aver letto, altrimenti cancellerebbe il carrello salvato
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(savedLines));
    } catch {}
  }, [savedLines, ready]);

  const clear = useCallback(() => setLines([]), []);

  const add = useCallback((id: ProductId, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === id);
      if (found) return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l));
      return [...prev, { id, qty }];
    });
    setBump((b) => b + 1);
  }, []);

  const setQty = useCallback((id: ProductId, qty: number) => {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l))));
  }, []);

  const value = useMemo(() => {
    // un prodotto tolto dal catalogo non deve restare nel conto
    const lines = savedLines.filter((l) => products.some((p) => p.id === l.id));
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const totalCents = lines.reduce((s, l) => s + l.qty * (products.find((p) => p.id === l.id)?.priceCents ?? 0), 0);
    return { lines, count, totalCents, open, setOpen, add, setQty, bump, products, checkoutEnabled, ready, clear };
  }, [savedLines, open, add, setQty, bump, products, checkoutEnabled, ready, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart deve stare dentro CartProvider");
  return c;
}
