// app/me/reservations/[id]/confirmation/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import { useMyReservations } from "@/hooks/rooms";

export default function ReservationConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading, error } = useMyReservations();
  const reservation = useMemo(
    () => data?.find((r) => r.id === id),
    [data, id]
  );

  if (!mounted || isLoading) return <p className="p-6">Loading…</p>;
  if (error || !reservation) return <p className="p-6 text-red-600">Reservation not found.</p>;

  const est = Number(reservation.est_total ?? 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-green-700 to-white text-white">
      <ClientNav />
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Reservation confirmed</h1>

        <div className="rounded-2xl bg-white text-black p-5 shadow space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium text-lg">
              {reservation.room_name ?? "Room"}
            </div>
            <span
              className={`text-xs rounded px-2 py-0.5 ${
                reservation.status === "confirmed"
                  ? "bg-green-100 text-green-800"
                  : reservation.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {reservation.status}
            </span>
          </div>

          <div className="text-sm text-neutral-700">
            <div>
              <span className="font-medium">Dates:</span>{" "}
              {reservation.start_date} → {reservation.end_date}
            </div>
            <div>
              <span className="font-medium">Nights:</span> {reservation.nights}
            </div>
            <div>
              <span className="font-medium">Estimated total:</span> {est}
            </div>
          </div>

          <div className="text-xs text-neutral-500 pt-1">
            Confirmation ID: {reservation.id}
          </div>

          <div className="pt-2 flex gap-2">
            <button
              className="rounded border px-3 py-1 text-sm"
              onClick={() => router.push("/me/reservations")}
            >
              Back to my reservations
            </button>
            {/* Optional: link to the room details if you have /rooms/[room_id] */}
            {reservation.room_id && (
              <a
                href={`/rooms/${reservation.room_id}`}
                className="rounded border px-3 py-1 text-sm"
              >
                View room
              </a>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-white/90">
          Thanks for booking with Havenia. A confirmation has been recorded—see
          your reservation anytime in <span className="underline">My Reservations</span>.
        </p>
      </main>
    </div>
  );
}