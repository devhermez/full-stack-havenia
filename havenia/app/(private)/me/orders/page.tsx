"use client";

import { useState } from "react";
import ClientNav from "@/components/ClientNav";
import { useMyOrders } from "@/hooks/orders";
import { useCreateOrderPI } from "@/hooks/payments";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import PayWithCard from "@/components/PayWithCard";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

export default function MyOrdersPage() {
  const { data, isLoading, error } = useMyOrders();
  const createPI = useCreateOrderPI();
  const qc = useQueryClient();
  const stripePromise = getStripe();

  const [payingFor, setPayingFor] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  async function startPay(orderId: string) {
    setPayingFor(orderId);
    try {
      const { client_secret } = await createPI.mutateAsync(orderId);
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
    <div className="w-screen min-h-screen bg-gradient-to-r from-amber-600 to-rose-700">
      <ClientNav />
      <div className="max-w-5xl mx-auto px-4 py-8 text-white">
        <h1 className="text-2xl font-semibold mb-6">My Orders</h1>

        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-300">Failed to load orders.</p>}
        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-neutral-200">No orders yet.</p>
        )}

        <ul className="space-y-3">
          {data?.map((o) => {
            const total = Number(o.total).toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            });
            return (
              <li
                key={o.id}
                className="bg-white text-black rounded-xl shadow p-4 flex items-center justify-between"
              >
                <div className="text-sm">
                  <div className="font-medium">Order {o.id.slice(0, 8)}…</div>
                  <div className="text-neutral-600">
                    {new Date(o.created_at).toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs">
                    Status: {o.status} · Payment: {o.payment_status} · Total: {total}
                  </div>
                  {/* Items */}
{Array.isArray(o.items) && o.items.length > 0 && (
  <div className="mt-3">
    <div className="text-xs font-medium text-neutral-700">Items</div>
    <ul className="mt-1 space-y-0.5 text-sm text-neutral-800">
      {o.items.map((it, i) => {
        const unit = Number(it.unit_price);
        const line = unit * Number(it.qty);
        return (
          <li key={i} className="flex justify-between">
            <span>{it.name} × {it.qty}</span>
            <span>
              {line.toLocaleString(undefined, { style: "currency", currency: "USD" })}
            </span>
          </li>
        );
      })}
    </ul>
  </div>
)}
                </div>

                <div className="flex items-center gap-2">
                  {/* Pay only when pending/unpaid */}
                  {o.status === "pending" && o.payment_status !== "paid" && (
                    <button
                      className="text-sm rounded px-3 py-1 bg-black text-white disabled:opacity-50"
                      onClick={() => startPay(o.id)}
                      disabled={createPI.isPending}
                    >
                      {createPI.isPending && payingFor === o.id ? "Preparing…" : "Pay"}
                    </button>
                  )}
                  
                </div>
                <Link
      href={`/me/orders/${o.id}`}
      className="text-sm rounded px-3 py-1 border border-black hover:bg-black hover:text-white transition"
    >
      View
    </Link>
                
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
              <button onClick={closePay} className="rounded border px-2 py-1 text-sm">
                Close
              </button>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PayWithCard
                clientSecret={clientSecret}
                onSuccess={() => {
                  const id = payingFor!;
                  closePay();
                  // refresh the list to show confirmed/paid
                  qc.invalidateQueries({ queryKey: ["orders", "me"] });
                  // go to a confirmation/receipt page
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