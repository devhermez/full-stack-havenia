// app/me/bookings/[id]/confirmation/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import { useMyActivityBookings } from "@/hooks/activities";

export default function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading, error } = useMyActivityBookings({ enabled: mounted });
  const booking = data?.find((b) => b.id === id);

  if (!mounted || isLoading) return <p className="p-6">Loading…</p>;
  if (error || !booking) return <p className="p-6 text-red-600">Not found.</p>;

  const total = Number(booking.price).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-cyan-500 to-blue-700 text-white">
      <ClientNav />
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Booking confirmed</h1>
        <div className="rounded-xl bg-white text-black p-4 space-y-2">
          <div className="font-medium">{booking.activity_name}</div>
          <div>{new Date(booking.start_ts).toLocaleString()} → {new Date(booking.end_ts).toLocaleString()}</div>
          <div>Status: <b>{booking.status}</b> · Payment: <b>{booking.payment_status ?? "paid"}</b></div>
          <div>Total: {total}</div>
          <div className="text-xs text-neutral-600">
            Confirmation ID: {booking.id}
          </div>
        </div>
      </div>
    </div>
  );
}