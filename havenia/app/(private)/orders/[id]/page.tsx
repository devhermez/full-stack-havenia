"use client";

import { useParams } from "next/navigation";
import { useMyOrder } from "@/hooks/orders";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, error } = useMyOrder(id);

  if (isLoading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-600">Failed to load order.</p>;
  if (!order) return <p className="p-6">Not found.</p>;

  return (
    <div className="w-screen px-6 py-8 space-y-6">
      <section className="bg-white border rounded-xl p-6">
        <h1 className="text-xl font-semibold">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <div className="mt-2 text-sm text-neutral-700">
          Placed: {new Date(order.created_at).toLocaleString()}
        </div>
        <div className="mt-2 text-sm flex flex-wrap gap-3">
          <span>Status: {order.status}</span>
          <span>Payment: {order.payment_status}</span>
          <span>Type: {order.delivery_type}</span>
          {order.scheduled_ts && (
            <span>
              Scheduled: {new Date(order.scheduled_ts).toLocaleString()}
            </span>
          )}
        </div>
      </section>

      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">Items</h2>
        {!order.items.length ? (
          <p className="text-sm text-neutral-600">No items.</p>
        ) : (
          <ul className="divide-y">
            {order.items.map((it, i) => {
              const unit = Number(it.unit_price);
              return (
                <li
                  key={`${it.menu_item_id}-${i}`}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="text-sm">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-neutral-600">Qty: {it.qty}</div>
                  </div>
                  <div className="text-sm">
                    {unit.toLocaleString(undefined, {
                      style: "currency",
                      currency: "USD",
                    })}{" "}
                    ea
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4 text-sm">
          <div>
            Subtotal:{" "}
            {Number(order.subtotal).toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </div>
          <div>
            Delivery fee:{" "}
            {Number(order.delivery_fee).toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </div>
          <div>
            Discount:{" "}
            {Number(order.discount).toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </div>
          <div className="font-semibold">
            Total:{" "}
            {Number(order.total).toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </div>
        </div>
        {order.payment_status !== "paid" && (
          <a
            href={`/orders/${order.id}/pay`}
            className="inline-block mt-4 border rounded px-3 py-1 text-sm"
          >
            Pay now
          </a>
        )}
      </section>
    </div>
  );
}
