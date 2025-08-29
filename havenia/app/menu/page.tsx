"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import { api } from "@/lib/api";
import Link from "next/link";
import type { AxiosError } from "axios";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
  image_url: string | null;
  prep_minutes: number | null;
  category: string | null;
  property_id: string | null;
  created_at: string;
};

export default function MenuPage() {
  const search = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [propertyId, setPropertyId] = useState(search.get("property_id") ?? "");
  const [category, setCategory] = useState(search.get("category") ?? "");

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (propertyId) p.set("property_id", propertyId);
    if (category) p.set("category", category);
    return p.toString();
  }, [propertyId, category]);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const { data } = await api.get<{ data: MenuItem[] }>("/menu", {
          params: {
            property_id: propertyId || undefined,
            category: category || undefined,
          },
        });
        setItems(data.data);
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
  }, [propertyId, category]);

  return (
    <div className="menu-container w-screen min-h-screen bg-amber-700">
      <ClientNav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4 text-white">Menu</h1>

        {/* Filters */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.replace(`/menu${params ? `?${params}` : ""}`);
          }}
          className="mb-6 grid gap-3 sm:grid-cols-3 text-black"
        >
          <input
            className=" rounded-lg px-3 py-2 bg-white"
            placeholder="Property ID (uuid) "
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          />
          <input
            className="rounded-lg px-3 py-2 bg-white"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button className="rounded-lg px-4 py-2 bg-white">
            Apply Filters
          </button>
        </form>

        {loading && <p>Loading…</p>}
        {!loading && err && <p className="text-red-600">{err}</p>}

        {!loading && !err && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-black">
            {items.map((it) => (
              <Link
                key={it.id}
                href={`/menu/${it.id}`}
                className="block bg-white rounded-2xl shadow p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{it.name}</h3>
                  <span className="text-sm">
                    {Intl.NumberFormat().format(it.price)}
                  </span>
                </div>
                {it.category && <p className="text-sm  mt-1">{it.category}</p>}
                <p className="text-sm mt-2 line-clamp-2">{it.description}</p>
                {!it.in_stock && (
                  <span className="mt-2 inline-block text-xs rounded bg-gray-200 px-2 py-0.5">
                    Out of stock
                  </span>
                )}
              </Link>
            ))}
            {items.length === 0 && (
              <p className="text-gray-600">No items match your filters.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
