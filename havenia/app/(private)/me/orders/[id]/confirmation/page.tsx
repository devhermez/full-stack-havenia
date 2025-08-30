"use client";

import { useParams } from "next/navigation";
import ClientNav from "@/components/ClientNav";
import { useMyOrder } from "@/hooks/orders";

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useMyOrder(id);

  if (isLoading) return <p className="p-6">Loading…</p>;
  if (error || !data) return <p className="p-6 text-red-600">Order not found.</p>;

  const subtotal = Number(data.subtotal).toLocaleString(undefined, { style: "currency", currency: "USD" });
  const delivery = Number(data.delivery_fee).toLocaleString(undefined, { style: "currency", currency: "USD" });
  const discount = Number(data.discount).toLocaleString(undefined, { style: "currency", currency: "USD" });
  const total = Number(data.total).toLocaleString(undefined, { style: "currency", currency: "USD" });

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-amber-600 to-rose-700 text-white">
      <ClientNav />
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Order confirmed</h1>

        <div className="bg-white text-black rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Order {data.id}</div>
            <div className="text-sm">Placed {new Date(data.created_at).toLocaleString()}</div>
          </div>

          <div className="text-sm">Delivery: <b>{data.delivery_type}</b></div>
          <div className="border-t pt-3">
            <div className="font-medium mb-1">Items</div>
            <ul className="space-y-1 text-sm">
              {data.items.map((it, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{it.name} × {it.qty}</span>
                  <span>
                    {Number(it.unit_price).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                  </span>
                </li>
              ))}
            </ul>
          </div>

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
    </div>
  );
}