// app/me/reservations/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import { useMyReservations, useCancelReservation } from "@/hooks/rooms";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import PayWithCard from "@/components/PayWithCard";
import { useCreateReservationPI } from "@/hooks/payments";
import { useQueryClient } from "@tanstack/react-query";

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const stripePromise = useMemo(() => getStripe(), []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading, error } = useMyReservations();
  const reservation = useMemo(
    () => data?.find((r) => r.id === id),
    [data, id]
  );

  const createPI = useCreateReservationPI();
  const cancelMut = useCancelReservation();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPay, setShowPay] = useState(false);

  async function startPay() {
    if (!id) return;
    try {
      const { client_secret } = await createPI.mutateAsync(id);
      setClientSecret(client_secret);
      setShowPay(true);
    } catch {
      setClientSecret(null);
      setShowPay(false);
    }
  }

  function closePay() {
    setShowPay(false);
    setClientSecret(null);
  }

  if (!mounted || isLoading) return <p className="p-6">Loading…</p>;
  if (error || !reservation)
    return <p className="p-6 text-red-600">Reservation not found.</p>;

  const est = Number(reservation.est_total ?? 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

  const canPay =
    reservation.status === "pending";

  return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-green-700 to-white text-white">
      <ClientNav />
      <main className="max-w-xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Reservation Details</h1>
          {canPay && (
            <button
              onClick={startPay}
              disabled={createPI.isPending}
              className="rounded bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
            >
              {createPI.isPending ? "Preparing…" : "Pay"}
            </button>
          )}
        </div>

        <div className="rounded-xl bg-white text-black p-5 shadow space-y-3">
          <div className="font-medium text-lg">
            {reservation.room_name ?? "Room"}
          </div>
          <div className="text-sm text-neutral-700">
            {reservation.start_date} → {reservation.end_date}
          </div>
          <div className="text-sm text-neutral-700">
            Nights: {reservation.nights}
          </div>
          <div className="text-sm text-neutral-700">Est: {est}</div>
          <div className="text-sm text-neutral-700">
            Status: <b>{reservation.status}</b>
          </div>
          <div className="text-xs text-neutral-500">
            Confirmation ID: {reservation.id}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="underline text-sm"
            onClick={() =>
              router.push(`/me/reservations/${reservation.id}/confirmation`)
            }
          >
            View confirmation
          </button>
          {reservation.status !== "canceled" && (
            <button
              onClick={() => cancelMut.mutate(reservation.id)}
              disabled={cancelMut.isPending}
              className="underline text-sm"
            >
              {cancelMut.isPending ? "Canceling…" : "Cancel reservation"}
            </button>
          )}
        </div>
      </main>

      {showPay && clientSecret && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-end md:items-center justify-center">
          <div className="w-full md:max-w-md md:rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-black">
                Complete payment
              </h2>
              <button
                onClick={closePay}
                className="rounded border px-2 py-1 text-sm"
              >
                Close
              </button>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PayWithCard
                clientSecret={clientSecret}
                onSuccess={() => {
                  const resId = reservation.id;
                  closePay();
                  qc.invalidateQueries({ queryKey: ["reservations"] });
                  window.location.href = `/me/reservations/${resId}/confirmation`;
                }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}