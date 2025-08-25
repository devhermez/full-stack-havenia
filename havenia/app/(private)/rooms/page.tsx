"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRooms } from "@/hooks/rooms";

export default function RoomsPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const [propertyId, setPropertyId] = useState(sp.get("property_id") ?? "");
  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");
  const [minCap, setMinCap] = useState(sp.get("min_capacity") ?? "");

  const { data: rooms, isLoading, error } = useRooms({
    property_id: propertyId,
    from: from || undefined,
    to: to || undefined,
    min_capacity: minCap ? Number(minCap) : undefined,
  });

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (propertyId) q.set("property_id", propertyId);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (minCap) q.set("min_capacity", minCap);
    router.push(`/rooms?${q.toString()}`);
  }

  return (
    <div className="w-screen max-w-none px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Rooms</h1>

      <form onSubmit={applyFilters} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-white p-4 rounded-xl shadow">
        <input
          className="border rounded-lg px-3 py-2 col-span-2"
          placeholder="Property ID (uuid)"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          required
        />
        <input
          type="date"
          className="border rounded-lg px-3 py-2"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From"
        />
        <input
          type="date"
          className="border rounded-lg px-3 py-2"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To"
        />
        <input
          type="number"
          min={1}
          className="border rounded-lg px-3 py-2"
          value={minCap}
          onChange={(e) => setMinCap(e.target.value)}
          placeholder="Min capacity"
        />
        <div className="sm:col-span-5">
          <button className="px-4 py-2 rounded-lg bg-black text-white">Search</button>
        </div>
      </form>

      <div className="mt-6">
        {isLoading && <p className="text-sm text-neutral-600">Loading…</p>}
        {error && <p className="text-sm text-red-600">Failed to load rooms</p>}
        {!isLoading && rooms && rooms.length === 0 && (
          <p className="text-sm text-neutral-600">No rooms found.</p>
        )}

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms?.map((r) => {
            const href = new URLSearchParams();
            if (from) href.set("from", from);
            if (to) href.set("to", to);
            return (
              <li key={r.id} className="bg-white rounded-xl shadow p-4">
                <div className="font-medium">{r.name}</div>
                <div className="text-sm text-neutral-600">
                  Capacity: {r.capacity} · Price/night: ₱{Number(r.price).toFixed(2)}
                </div>
                {r.nights != null && r.est_total && (
                  <div className="mt-1 text-sm">
                    {r.nights} night(s) · Est total: ₱{r.est_total}
                  </div>
                )}
                <div className="mt-3">
                  <Link
                    href={`/rooms/${r.id}${href.toString() ? `?${href.toString()}` : ""}`}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    View & reserve
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}