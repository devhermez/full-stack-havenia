"use client";

import Link from "next/link";
import { useCancelReservation, useMyReservations } from "@/hooks/rooms";

export default function MyReservationsPage() {
  const { data, isLoading, error } = useMyReservations();
  const cancelRes = useCancelReservation();

  return (
    <div className="w-screen max-w-none px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">My Reservations</h1>

      {isLoading && <p>Loading…</p>}
      {error && <p className="text-red-600">Failed to load reservations</p>}
      {!isLoading && (!data || data.length === 0) && (
        <p className="text-sm text-neutral-600">No reservations yet.</p>
      )}

      <ul className="space-y-3">
        {data?.map((r) => (
          <li key={r.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{r.room_name ?? r.room_id}</div>
              <div className="text-neutral-600">
                {r.start_date} → {r.end_date} · {r.nights} night(s) · Est: ₱{r.est_total}
              </div>
              <div className="mt-1 text-xs inline-block border rounded px-2 py-0.5">
                {r.status}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/rooms/reservations/${r.id}`} className="text-sm border rounded px-3 py-1">
                View
              </Link>
              {r.status !== "canceled" && (
                <button
                  className="text-sm border rounded px-3 py-1"
                  onClick={() => cancelRes.mutate(r.id)}
                  disabled={cancelRes.isPending}
                >
                  {cancelRes.isPending ? "Canceling…" : "Cancel"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}