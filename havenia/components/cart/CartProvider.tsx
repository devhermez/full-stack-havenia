"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;        // total units
  subtotal: number;     // sum(price * qty)
};

const CartCtx = createContext<CartState | null>(null);
const LS_KEY = "havenia:cart";

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  // persist on change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const api: CartState = useMemo(() => ({
    items,
    add: (it, qty = 1) => {
      setItems((prev) => {
        const i = prev.findIndex(p => p.id === it.id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], qty: next[i].qty + qty };
          return next;
        }
        return [...prev, { ...it, qty }];
      });
    },
    remove: (id) => setItems((prev) => prev.filter(p => p.id !== id)),
    setQty: (id, qty) => setItems((prev) => prev.map(p => p.id === id ? { ...p, qty } : p)),
    clear: () => setItems([]),
    count: items.reduce((a, b) => a + b.qty, 0),
    subtotal: items.reduce((a, b) => a + b.price * b.qty, 0),
  }), [items]);

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}