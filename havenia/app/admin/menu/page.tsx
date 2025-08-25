"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import ClientNav from "@/components/ClientNav";
import { api } from "@/lib/api";
import Link from "next/link";
import type { AxiosError } from "axios";

type AdminMenuItem = {
  id: string; name: string; description: string;
  price: number; in_stock: boolean; category: string | null;
  created_at: string;
};

export default function AdminMenuListPage() {
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ data: AdminMenuItem[] }>("/menu");
        setItems(data.data);
      } catch (e) {
        const ax = e as AxiosError<any>;
        setErr(ax.response?.data?.error?.message ?? ax.message ?? "Failed to load menu");
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <AdminGuard>
      <ClientNav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin · Menu</h1>
          <Link href="/admin/menu/new" className="rounded-lg border px-4 py-2">Create item</Link>
        </div>

        {loading && <p>Loading…</p>}
        {err && <p className="text-red-600">{err}</p>}

        {!loading && !err && (
          <div className="grid gap-3">
            {items.map((it) => (
              <div key={it.id} className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-sm text-gray-500">{it.category ?? "Uncategorized"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/menu/${it.id}`} className="rounded-lg border px-3 py-1">View</Link>
                  <Link href={`/admin/menu/${it.id}/edit`} className="rounded-lg border px-3 py-1">Edit</Link>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-gray-600">No items yet.</p>}
          </div>
        )}
      </main>
    </AdminGuard>
  );
}