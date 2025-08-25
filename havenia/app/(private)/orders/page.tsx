"use client";

import Link from "next/link";
import { useMyOrders } from "@/hooks/orders";

export default function MyOrdersPage() {
  const { data, isLoading, error } = useMyOrders();

  if (isLoading) return <p className="p-6">Loading orders…</p>;
  if (error) return <p className="p-6 text-red-600">Failed to load orders.</p>;

  return (
    <div className="w-screen px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <Link href="/orders/new" className="border rounded px-3 py-1 text-sm">
          New order
        </Link>
      </div>

      {!data?.length ? (
        <p className="text-sm text-neutral-600">No orders yet.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((o) => {
            const total = Number(o.total);
            return (
              <li key={o.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">#{o.id.slice(0, 8).toUpperCase()}</div>
                  <div className="text-neutral-600">
                    {new Date(o.created_at).toLocaleString()} · {o.delivery_type} · {o.status}
                  </div>
                  <div className="mt-1">
                    Total:{" "}
                    {total.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                  </div>
                </div>
                <Link href={`/orders/${o.id}`} className="text-sm border rounded px-3 py-1">
                  View
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}