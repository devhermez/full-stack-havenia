"use client";

import Link from "next/link";
import { useCancelReservation, useMyReservations } from "@/hooks/rooms";
import ClientNav from "@/components/ClientNav";

export default function MyReservationsPage() {
  const { data, isLoading, error } = useMyReservations();
  const cancelRes = useCancelReservation();

  return (
    <div className="w-screen min-h-screen  bg-gray-600">
      <ClientNav />
      <div className="px-4 py-6 text-white">
        <h1 className="text-xl font-semibold mb-4">My Reservations</h1>

        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-600">Failed to load reservations</p>}
        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-neutral-600">No reservations yet.</p>
        )}

        <ul className="space-y-3">
          {data?.map((r) => (
            <li
              key={r.id}
              className="bg-white text-black rounded-xl shadow p-4 flex items-center justify-between"
            >
              <div className="text-md flex flex-col">
                <div className="text-lg font-medium">{r.room_name ?? r.room_id}</div>
                <div className="text-neutral-600 flex flex-col gap-1">
                  <p>
                    {r.start_date} → {r.end_date}
                  </p>

                  <p>{r.nights} night(s)</p>
                  <p>Est: ₱{r.est_total}</p>
                </div>
                <div className="flex justify-between items-center mt-2 w-75">
                  <div className="text-md  text-neutral-600 inline-block ">
                    <p>Status: {r.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status !== "canceled" && (
                      <button
                        className="text-md border rounded px-3 py-1"
                        onClick={() => cancelRes.mutate(r.id)}
                        disabled={cancelRes.isPending}
                      >
                        {cancelRes.isPending ? "Canceling…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
