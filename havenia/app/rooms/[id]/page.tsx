"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { useRoom, useCreateReservation } from "@/hooks/rooms";
import ClientNav from "@/components/ClientNav";

type Props = { params: { id: string } };

export default function RoomDetailPage({ params }: Props) {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();

  const [start, setStart] = useState(sp.get("from") ?? "");
  const [end, setEnd] = useState(sp.get("to") ?? "");

  const { data: room, isLoading, error } = useRoom(id);
  const createRes = useCreateReservation();

  async function reserve(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) return;

    const res = await createRes.mutateAsync({
      room_id: id,
      start_date: start,
      end_date: end,
    });
    router.push(`/rooms/reservations/${res.id}`);
  }

  return (
    <div className="w-screen bg-amber-800 min-h-screen">
      <ClientNav />
      <div className="px-4 py-28">
        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-600">Failed to load room</p>}
        {room && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h1 className="text-xl font-semibold text-black">{room.name}</h1>
            <p className="text-sm text-neutral-600">
              Capacity: {room.capacity} · Price/night: ₱
              {Number(room.price).toFixed(2)}
            </p>

            <form
              onSubmit={reserve}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <input
                type="date"
                className="border rounded-lg px-3 py-2 placeholder-gray-400"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
              <input
                type="date"
                className="border rounded-lg px-3 py-2 placeholder-gray-400"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
              <button
                className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
                disabled={createRes.isPending}
              >
                {createRes.isPending ? "Reserving…" : "Reserve"}
              </button>
            </form>

            {createRes.isError && (
              <p className="text-sm text-red-600">Reservation failed.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
