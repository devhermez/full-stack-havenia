// app/menu/page.tsx
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import { api } from "@/lib/api";
import Link from "next/link";
import type { AxiosError } from "axios";
import { useCart } from "@/components/cart/CartProvider";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
  image_url: string | null;
  prep_minutes: number | null;
  category: string | null; // category *name* coming from backend
  property_id: string | null;
  created_at: string;
};

function MenuInner() {
  const { add } = useCart();
  const search = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // toast
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const showToast = (text: string) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setToast(text);
    timerRef.current = window.setTimeout(() => setToast(null), 1800);
  };

  // filters (from URL)
  const [q, setQ] = useState(search.get("q") ?? "");
  const [category, setCategory] = useState(search.get("category") ?? "");

  // fetch once (client-side filtering handles free-text like "drinks")
  useEffect(() => {
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const { data } = await api.get<{ data: MenuItem[] }>("/menu");
        setItems(data.data ?? []);
      } catch (_e) {
        const ax = _e as AxiosError<any>;
        setErr(
          ax.response?.data?.error?.message ??
            ax.response?.data?.message ??
            ax.message ??
            "Failed to load menu"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // computed filtered list
  const filtered = useMemo(() => {
    const qLC = q.trim().toLowerCase();
    const catLC = category.trim().toLowerCase();
    return items.filter((it) => {
      const byName = qLC ? it.name.toLowerCase().includes(qLC) : true;
      const byCat = catLC
        ? (it.category ?? "").toLowerCase().includes(catLC)
        : true;
      return byName && byCat;
    });
  }, [items, q, category]);

  // update URL on submit (optional nicety)
  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category.trim()) params.set("category", category.trim());
    router.replace(`/menu${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="menu-container w-screen min-h-screen bg-gradient-to-r from-amber-900 to-amber-500">
      <ClientNav />

      {/* toast */}
      {toast && (
        <div className="fixed w-75 bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-md bg-black/85 text-white text-sm px-4 py-2 shadow flex justify-center items-center text-center gap-2">
          {toast}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 text-green-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-8 py-8 md:p-10 lg:px-6 lg:min-w-screen">
        <h1 className="text-2xl font-semibold mb-2 text-white">Menu</h1>
        <p className="text-white mb-4 tinos-regular">
          Discover Havenia’s flavors! Browse our freshly prepared dishes and add your favorites to the cart for a perfect meal.
        </p>

        {/* Filters */}
        <form onSubmit={applyFilters} className="mb-6 grid gap-3 sm:grid-cols-3 text-black">
          <input
            className="rounded-lg px-3 py-2 bg-white"
            placeholder="Search dishes by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <input
            className="rounded-lg px-3 py-2 bg-white"
            placeholder='Category (e.g. "drinks", "dessert")'
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button className="rounded-lg px-4 py-2 bg-white">Apply Filters</button>
        </form>

        {loading && <p>Loading…</p>}
        {!loading && err && <p className="text-red-600">{err}</p>}

        {!loading && !err && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-black">
            {filtered.map((it) => {
              const priceText = Intl.NumberFormat(undefined, {
                style: "currency",
                currency: "USD",
              }).format(it.price);
              const bg = it.image_url ? `url("${it.image_url}")` : undefined;

              return (
                <div
                  key={it.id}
                  className="rounded-2xl shadow p-4 hover:shadow-md transition relative bg-cover bg-black/10 bg-blend-overlay text-white lg:bg-center"
                  style={bg ? { backgroundImage: bg } : undefined}
                >
                  <Link href={`/menu/${it.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{it.name}</h3>
                      <span className="text-sm">{priceText}</span>
                    </div>
                    {it.category && <p className="text-sm mt-1">{it.category}</p>}
                    <p className="text-sm mt-2 line-clamp-2">{it.description}</p>
                  </Link>

                  <div className="mt-3 flex items-center justify-between">
                    {!it.in_stock ? (
                      <span className="text-xs rounded bg-gray-200/90 text-black px-2 py-0.5">
                        Out of stock
                      </span>
                    ) : (
                      <button
                        className="text-sm rounded-lg px-3 py-1 bg-white/95 text-black hover:bg-white"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          add({ id: it.id, name: it.name, price: it.price }, 1);
                          showToast(`Added “${it.name}” to your cart`);
                        }}
                      >
                        Add to cart
                      </button>
                    )}
                    <Link href={`/menu/${it.id}`} className="text-sm underline">
                      Details
                    </Link>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p className="text-white/90">
                No items match your filters. Try clearing the search or using a different category term.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading menu…</div>}>
      <MenuInner />
    </Suspense>
  );
}

// Ensure Vercel treats this as dynamic (no static prerender issues)
export const dynamic = "force-dynamic";