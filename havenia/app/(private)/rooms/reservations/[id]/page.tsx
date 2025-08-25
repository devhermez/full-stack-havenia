"use client";

import Link from "next/link";
import { useMyReservation, useCancelReservation } from "@/hooks/rooms";

type Props = { params: { id: string } };

export default function ReservationDetailPage({ params }: Props) {
  const { id } = params;
  const { data: r, isLoading, error } = useMyReservation(id);
  const cancelRes = useCancelReservation();

  return (
    <div className="w-screen max-w-none px-4 py-6">
      {isLoading && <p>Loading…</p>}
      {error && <p className="text-red-600">Failed to load reservation</p>}
      {r && (
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <h1 className="text-xl font-semibold">Reservation #{r.id.slice(0, 8)}</h1>
          <div className="text-sm text-neutral-700">
            <div>Room: {r.room_name ?? r.room_id}</div>
            <div>
              Dates: {r.start_date} → {r.end_date} ({r.nights} night{r.nights > 1 ? "s" : ""})
            </div>
            <div>Estimated total: ₱{r.est_total}</div>
            <div className="mt-1 inline-block text-xs border rounded px-2 py-0.5">{r.status}</div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Link href="/rooms/reservations" className="text-sm border rounded px-3 py-1">
              Back to list
            </Link>
            {r.status !== "canceled" && (
              <button
                className="text-sm border rounded px-3 py-1"
                onClick={() => cancelRes.mutate(r.id)}
                disabled={cancelRes.isPending}
              >
                {cancelRes.isPending ? "Canceling…" : "Cancel reservation"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}