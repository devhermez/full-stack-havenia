"use client";

import AdminGuard from "@/components/AdminGuard";
import ClientNav from "@/components/ClientNav";
import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";

export default function AdminNewMenuItem() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [prepMinutes, setPrepMinutes] = useState<number | "">("");
  const [inStock, setInStock] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const payload = {
        name,
        description,
        price: typeof price === "string" ? Number(price || 0) : price,
        category_id: categoryId || undefined,
        property_id: propertyId || undefined,
        image_url: imageUrl || undefined,
        prep_minutes: typeof prepMinutes === "string" ? Number(prepMinutes || 0) : prepMinutes,
        in_stock: inStock,
      };
      const { data } = await api.post("/menu", payload);
      router.push(`/menu/${data.id}`);
    } catch (e) {
      const ax = e as AxiosError<any>;
      setErr(ax.response?.data?.error?.message ?? ax.message ?? "Create failed");
    } finally { setLoading(false); }
  }

  return (
    <AdminGuard>
      
      <main className="max-w-md mx-auto px-4 py-8 text-black">
        <h1 className="text-2xl font-semibold mb-6">Create Menu Item</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <textarea className="w-full border rounded-lg px-3 py-2" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Price" value={price} onChange={e=>setPrice(e.target.value===""?"":Number(e.target.value))} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Category ID (uuid)" value={categoryId} onChange={e=>setCategoryId(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Property ID (uuid)" value={propertyId} onChange={e=>setPropertyId(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Image URL" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Prep minutes" value={prepMinutes} onChange={e=>setPrepMinutes(e.target.value===""?"":Number(e.target.value))} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={inStock} onChange={(e)=>setInStock(e.target.checked)} /> In stock
          </label>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button disabled={loading} className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50">
            {loading ? "Creating…" : "Create"}
          </button>
        </form>
      </main>
    </AdminGuard>
  );
}