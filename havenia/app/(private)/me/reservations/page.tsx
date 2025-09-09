"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCancelReservation, useMyReservations } from "@/hooks/rooms";
import ClientNav from "@/components/ClientNav";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import PayWithCard from "@/components/PayWithCard";
import { useCreateReservationPI } from "@/hooks/payments";
import { useQueryClient } from "@tanstack/react-query";

export default function MyReservationsPage() {
  return <Content />;
}

function Content() {
  const { data, isLoading, error } = useMyReservations();
  const cancelRes = useCancelReservation();

  const stripePromise = getStripe();
  const createPI = useCreateReservationPI();
  const qc = useQueryClient();

  const [payingFor, setPayingFor] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  async function startPay(reservationId: string) {
    setPayingFor(reservationId);
    try {
      const { client_secret } = await createPI.mutateAsync(reservationId);
      setClientSecret(client_secret);
    } catch {
      setPayingFor(null);
      setClientSecret(null);
    }
  }

  function closePay() {
    setPayingFor(null);
    setClientSecret(null);
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-b from-green-700 to-white">
      <ClientNav />
      <div className="px-4 py-6 text-white">
        <h1 className="text-xl font-semibold mb-2">My Reservations</h1>
        <p className="text-white mb-4 tinos-regular">
          Plan your perfect stay with ease. View, manage, or pay for your room
          reservations anytime.
        </p>

        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-400">Failed to load reservations</p>}
        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-neutral-300">No reservations yet.</p>
        )}

        <ul className="space-y-3">
          {data?.map((r) => {
            const est = Number(r.est_total ?? 0).toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            });
            return (
              <li
                key={r.id}
                className="bg-white text-black rounded-xl shadow p-4 flex items-center justify-between"
              >
                <div className="text-md flex-col">
                  <div className="">
                    <div className="text-lg font-medium">
                      {r.room_name ?? r.room_id}
                    </div>
                    <div className="text-neutral-600 flex flex-col gap-1">
                      <p>
                        {r.start_date} → {r.end_date}
                      </p>
                      <p>{r.nights} night(s)</p>
                      <p>Est: {est}</p>
                    </div>
                    <div className="text-md text-neutral-600 inline-block">
                      <p>Status: {r.status}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2 w-75">
                    <div className="flex items-center w-100 justify-between gap-2">
                      {/* Pay only when pending */}
                      {r.status === "pending" && (
                        <button
                          className="text-md rounded px-3 py-1 bg-black text-white disabled:opacity-50"
                          onClick={() => startPay(r.id)}
                          disabled={createPI.isPending}
                        >
                          {createPI.isPending && payingFor === r.id
                            ? "Preparing…"
                            : "Pay"}
                        </button>
                      )}
                      {/* NEW: View details */}
                      <Link
                        href={`/me/reservations/${r.id}`}
                        className="text-md border rounded px-3 py-1 hover:bg-black hover:text-white transition"
                      >
                        View
                      </Link>
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
            );
          })}
        </ul>
      </div>

      {/* Stripe modal */}
      {clientSecret && payingFor && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-end md:items-center justify-center">
          <div className="w-full md:max-w-md md:rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Complete payment</h2>
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
                  const id = payingFor!;
                  closePay();
                  // refresh the list
                  qc.invalidateQueries({ queryKey: ["reservations"] });
                  // optional confirmation page
                  window.location.href = `/me/reservations/${id}/confirmation`;
                }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}
