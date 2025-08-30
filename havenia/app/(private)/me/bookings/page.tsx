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
        <h1 className="text-2xl font-semibold mb-6">My Activity Bookings</h1>
        {data && data.length > 0 ? (
          <ul className="space-y-3">
            {data.map((b) => {
              const priceText = Number(b.price).toLocaleString(undefined, {
                style: "currency",
                currency: "USD",
              });

              return (
                <li
                  key={b.id}
                  className="border rounded p-4 text-black bg-white flex items-center justify-between"
                >
                  <div className="text-sm">
                    <div className="font-medium">{b.activity_name}</div>
                    <div className="text-neutral-600">
                      {new Date(b.start_ts).toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs">
                      Status: {b.status} · Payment: {b.payment_status} · Price:{" "}
                      {priceText}
                    </div>
                  </div>
                  
                  {b.payment_status === 'paid' && (<a
                    href={`/me/bookings/${b.id}`}
                    className="text-sm border rounded px-3 py-1 bg-white text-black"
                  >
                    View
                  </a>)}

                  <div className="flex items-center gap-2">
                    {b.status !== "canceled" && (
                      <button
                        onClick={() => cancelMut.mutate(b.id)}
                        disabled={cancelMut.isPending}
                        className="text-sm border rounded px-3 py-1"
                      >
                        {cancelMut.isPending ? "Canceling…" : "Cancel"}
                      </button>
                    )}
                    

                    {/* Show Pay button for unpaid / pending */}
                    {b.status === "pending" && (
                      <button
                        onClick={() => startPay(b.id)}
                        disabled={createPI.isPending}
                        className="text-sm border rounded px-3 py-1 bg-black text-white disabled:opacity-50"
                      >
                        {createPI.isPending && payingFor === b.id
                          ? "Preparing…"
                          : "Pay"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-neutral-200">No bookings yet.</p>
        )}
      </div>

      {/* Minimal modal/drawer for Stripe Elements */}
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
                  closePay();
                  // Optional: refetch bookings to show confirmed
                  // You can also invalidate the query via React Query if desired

                  setTimeout(() => {
                    qc.invalidateQueries({ queryKey: ["me", "bookings"] });
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
