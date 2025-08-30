// app/me/orders/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import { useMyOrder } from "@/hooks/orders";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import PayWithCard from "@/components/PayWithCard";
import { useCreateOrderPI } from "@/hooks/payments";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, error } = useMyOrder(id);
  const createPI = useCreateOrderPI();
  const stripePromise = useMemo(() => getStripe(), []);

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

  if (isLoading) return <p className="p-6">Loading…</p>;
  if (error || !data) return <p className="p-6 text-red-600">Order not found.</p>;

  const subtotal = Number(data.subtotal).toLocaleString(undefined, { style: "currency", currency: "USD" });
  const delivery = Number(data.delivery_fee).toLocaleString(undefined, { style: "currency", currency: "USD" });
  const discount = Number(data.discount).toLocaleString(undefined, { style: "currency", currency: "USD" });
  const total = Number(data.total).toLocaleString(undefined, { style: "currency", currency: "USD" });

  const canPay = data.status === "pending" && data.payment_status !== "paid";

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-amber-600 to-rose-700 text-white">
      <ClientNav />
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Order Details</h1>
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

        <div className="bg-white text-black rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Order {data.id}</div>
            <div className="text-sm">Placed {new Date(data.created_at).toLocaleString()}</div>
          </div>

          <div className="text-sm">Delivery: <b>{data.delivery_type}</b></div>

          {/* Items */}
          <div className="border-t pt-3">
            <div className="font-medium mb-1">Items</div>
            <ul className="space-y-1 text-sm">
              {Array.isArray(data.items) && data.items.map((it, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{it.name} × {it.qty}</span>
                  <span>
                    {Number(it.unit_price).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="border-t pt-3 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{subtotal}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{delivery}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-{discount}</span></div>
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span><span>{total}</span>
            </div>
          </div>

          <div className="border-t pt-3 text-sm">
            Status: <b>{data.status}</b> · Payment: <b>{data.payment_status}</b>
          </div>
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
                  closePay();
                  // refresh this order
                  qc.invalidateQueries({ queryKey: ["orders", "me", id] });
                  // optional: also refresh list
                  qc.invalidateQueries({ queryKey: ["orders", "me"] });
                  // send to confirmation page (you already have it)
                  window.location.href = `/me/orders/${id}/confirmation`;
                }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}