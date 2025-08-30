// app/me/bookings/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import { useMyActivityBookings } from "@/hooks/activities";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import PayWithCard from "@/components/PayWithCard";
import { useCreateActivityBookingPI } from "@/hooks/payments";
import { useQueryClient } from "@tanstack/react-query";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const stripePromise = useMemo(() => getStripe(), []);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // reuse the list endpoint then find the one we need (no single-GET yet)
  const { data, isLoading, error } = useMyActivityBookings({ enabled: mounted });
  const booking = data?.find((b) => b.id === id);

  const createPI = useCreateActivityBookingPI();
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
  if (error || !booking) return <p className="p-6 text-red-600">Booking not found.</p>;

  const total = Number(booking.price).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
  const canPay = booking.status === "pending" && booking.payment_status !== "paid";

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-cyan-500 to-blue-700 text-white">
      <ClientNav />
      <div className="max-w-xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Booking Details</h1>
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

        <div className="rounded-xl bg-white text-black p-4 space-y-2">
          <div className="font-medium">{booking.activity_name}</div>
          <div>{new Date(booking.start_ts).toLocaleString()} → {new Date(booking.end_ts).toLocaleString()}</div>
          <div>Guests: 1</div>
          <div>Status: <b>{booking.status}</b> · Payment: <b>{booking.payment_status ?? "unpaid"}</b></div>
          <div>Total: {total}</div>
        </div>

        <div className="mt-4">
          <button
            className="underline text-sm"
            onClick={() => router.push(`/me/bookings/${booking.id}/confirmation`)}
          >
            View confirmation
          </button>
        </div>
      </div>

      {/* Stripe modal */}
      {showPay && clientSecret && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-end md:items-center justify-center">
          <div className="w-full md:max-w-md md:rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-black">Complete payment</h2>
              <button onClick={closePay} className="rounded border px-2 py-1 text-sm">Close</button>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PayWithCard
                clientSecret={clientSecret}
                onSuccess={() => {
                  const bookId = booking.id;
                  closePay();
                  // refresh list cache and stay on page
                  qc.invalidateQueries({ queryKey: ["me", "bookings"] });
                  // go to confirmation page
                  window.location.href = `/me/bookings/${bookId}/confirmation`;
                }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}