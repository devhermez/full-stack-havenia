"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { useCancelMyBooking, useMyActivityBookings } from "@/hooks/activities";
import ClientNav from "@/components/ClientNav";
import { getStripe } from "@/lib/stripe";
import { Elements } from "@stripe/react-stripe-js";
import PayWithCard from "@/components/PayWithCard";
import { useCreateActivityBookingPI } from "@/hooks/payments";
import { useQueryClient } from "@tanstack/react-query";

export default function MyBookingsPage() {
  return (
    <RequireAuth>
      <Content />
    </RequireAuth>
  );
}

function Content() {
  const [mounted, setMounted] = useState(false);
  const stripePromise = getStripe();
  const qc = useQueryClient();

  useEffect(() => setMounted(true), []);

  const { data, isLoading, error } = useMyActivityBookings({
    enabled: mounted,
  });
  const cancelMut = useCancelMyBooking();
  const createPI = useCreateActivityBookingPI();

  const [payingFor, setPayingFor] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  async function startPay(bookingId: string) {
    setPayingFor(bookingId);
    try {
      const res = await createPI.mutateAsync(bookingId);
      setClientSecret(res.client_secret);
    } catch {
      setPayingFor(null);
      setClientSecret(null);
      // Optionally show a toast
    }
  }

  function closePay() {
    setPayingFor(null);
    setClientSecret(null);
  }

  if (!mounted) return <p className="p-6">Loading…</p>;
  if (isLoading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-600">Failed to load.</p>;

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-cyan-500 to-blue-700">
      <ClientNav />
      <div className="px-6 py-8 text-white">
        <h1 className="text-2xl font-semibold mb-2">My Activity Bookings</h1>
        <p className="text-white mb-4 tinos-regular">
          Your adventures at Havenia start here. Review your booked activities and complete payments to confirm your spot.
        </p>

        {data && data.length > 0 ? (
          <ul className="space-y-3">
            {data.map((b) => {
              const priceText = Number(b.price).toLocaleString(undefined, {
                style: "currency",
                currency: "USD",
              });
              const canPay = b.status === "pending" && b.payment_status !== "paid";

              return (
                <li key={b.id} className="border rounded p-4 text-black bg-white flex items-center justify-between">
                  <div className="text-md">
                    <div className="font-bold">{b.activity_name}</div>
                    <div className="text-neutral-600">
                      {new Date(b.start_ts).toLocaleString()}
                    </div>
                    <div className="mt-1 text-sm">
                      <p>Status: {b.status}</p>
                      <p>Payment: {b.payment_status ?? "unpaid"}</p>
                      <p>Price: {priceText}</p>
                    </div>
                  </div>

                  <div className="flex flex-col text-center gap-4">
                    <a
                      href={`/me/bookings/${b.id}`}
                      className="text-sm border rounded px-3 py-1 bg-white text-black"
                    >
                      View
                    </a>

                    <div className="flex flex-col gap-4 items-center">
                      {canPay && (
                        <button
                          onClick={() => startPay(b.id)}
                          disabled={createPI.isPending}
                          className="text-sm border rounded px-3 py-1 bg-black text-white disabled:opacity-50"
                        >
                          {createPI.isPending && payingFor === b.id ? "Preparing…" : "Pay"}
                        </button>
                      )}

                      {b.status !== "canceled" && (
                        <button
                          onClick={() => cancelMut.mutate(b.id)}
                          disabled={cancelMut.isPending}
                          className="text-sm border rounded px-3 py-1"
                        >
                          {cancelMut.isPending ? "Canceling…" : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-neutral-200">No bookings yet.</p>
        )}
      </div>

      {clientSecret && payingFor && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-end md:items-center justify-center">
          <div className="w-full md:max-w-md md:rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Complete payment</h2>
              <button onClick={closePay} className="rounded border px-2 py-1 text-sm">Close</button>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PayWithCard
                clientSecret={clientSecret}
                onSuccess={() => {
                  const dest = payingFor!;        // capture the current booking id
                  closePay();
                  // give the webhook a moment to flip the DB, then refetch + navigate
                  setTimeout(() => {
                    qc.invalidateQueries({ queryKey: ["me", "bookings"] });
                    window.location.href = `/me/bookings/${dest}/confirmation`;
                  }, 1200);
                }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}