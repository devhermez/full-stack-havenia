// app/rooms/page.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

type Room = {
  id: string;
  property_id: string;
  name: string;
  capacity: number;
  price: string;
  created_at: string;
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ data: Room[] }>("/rooms", {
          params: { property_id: "57f55098-0537-4aca-a528-404b512c503b" }, // TODO: dynamic property_id
        });
        setRooms(data.data);
      } catch (e: any) {
        setErr(e?.response?.data?.error?.message ?? "Failed to load rooms");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="p-6">Loading rooms…</p>;
  if (err) return <p className="p-6 text-red-600">{err}</p>;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Available Rooms</h1>
      {rooms.length === 0 ? (
        <p className="text-neutral-600">No rooms available.</p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <li key={room.id} className="border rounded-lg p-4 bg-white shadow">
              <h2 className="text-lg font-medium">{room.name}</h2>
              <p className="text-sm text-neutral-600">Capacity: {room.capacity}</p>
              <p className="text-sm text-neutral-600">₱{room.price}</p>
              <Link
                href={`/rooms/${room.id}`}
                className="mt-3 inline-block px-3 py-1 text-sm rounded-lg bg-black text-white"
              >
                View details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}