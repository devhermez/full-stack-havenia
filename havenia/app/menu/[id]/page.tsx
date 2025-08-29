// app/menu/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import { api } from "@/lib/api";
import Link from "next/link";
import type { AxiosError } from "axios";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number; // number in your list page; keeping same here
  in_stock: boolean;
  image_url: string | null;
  prep_minutes: number | null;
  category: string | null;
  property_id: string | null;
  created_at: string;
};

export default function MenuItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const res = await api.get(`/menu/${id}`, {
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
        });

        // If you already had an item and got a 304, just keep it
        if (res.status === 304 && !res.data) {
          if (!cancelled) setLoading(false);
          return;
        }

        const payload = res.data as any;
        const it = payload?.item ?? payload?.data ?? payload; // supports { item }, { data }, or raw
        if (!it) throw new Error("Item payload missing");

        if (!cancelled) setItem(it as MenuItem);
      } catch (e: any) {
        if (!cancelled) {
          setErr(
            e?.response?.data?.error?.message ??
              e?.response?.data?.message ??
              e.message ??
              "Failed to load item"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="p-6">Loading item…</p>;
  if (err) return <p className="p-6 text-red-600">{err}</p>;
  if (!item) return <p className="p-6">Not found.</p>;

  const priceText = Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(item.price);

  return (
    <div className="w-screen min-h-screen bg-amber-700">
      <ClientNav />

      <main className="max-w-5xl mx-auto px-4 py-8 text-black">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-white/90 hover:text-white underline"
          >
            ← Back
          </button>
        </div>

        <article className="grid gap-6 md:grid-cols-2 bg-white rounded-2xl shadow p-4 md:p-6">
          {/* Image */}
          <div className="order-1 md:order-none">
            {item.image_url ? (
              <div
                className="w-full aspect-[16/10] rounded-xl bg-center bg-cover"
                style={{ backgroundImage: `url("${item.image_url}")` }}
                aria-label={item.name}
              />
            ) : (
              <div className="w-full aspect-[16/10] rounded-xl bg-neutral-100 grid place-items-center text-neutral-400">
                No image
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold">{item.name}</h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
              {item.category && (
                <span className="inline-block rounded-full border px-2 py-0.5">
                  {item.category}
                </span>
              )}
              {item.prep_minutes != null && (
                <span className="inline-block rounded-full border px-2 py-0.5">
                  Prep: {item.prep_minutes} min
                </span>
              )}
              {item.in_stock ? (
                <span className="inline-block rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 px-2 py-0.5">
                  In stock
                </span>
              ) : (
                <span className="inline-block rounded-full border border-red-300 bg-red-50 text-red-700 px-2 py-0.5">
                  Out of stock
                </span>
              )}
            </div>

            <div className="text-xl font-medium">{priceText}</div>

            <p className="text-sm text-neutral-700 whitespace-pre-line">
              {item.description}
            </p>

            <div className="pt-2 flex items-center gap-3">
              {/* If you later add a cart/ordering flow, wire this up */}
              <button
                disabled={!item.in_stock}
                className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
                onClick={() => alert("Add-to-order coming soon")}
              >
                Add to order
              </button>

              <Link
                href="/menu"
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Back to menu
              </Link>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
