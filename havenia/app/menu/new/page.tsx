"use client";

import { useState } from "react";
import { useCreateOrder } from "@/hooks/orders";
import { useRouter } from "next/navigation";

type Line = { menu_item_id: string; qty: number; notes?: string };

export default function NewOrderPage() {
  const router = useRouter();
  const createOrder = useCreateOrder();

  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [addressId, setAddressId] = useState("");
  const [scheduledTs, setScheduledTs] = useState("");
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState<Line[]>([{ menu_item_id: "", qty: 1 }]);
  const [err, setErr] = useState<string | null>(null);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, { menu_item_id: "", qty: 1 }]);
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setErr(null);

    // basic client validation that mirrors server
    if (deliveryType === "delivery" && !addressId) {
      setErr("Address is required for delivery.");
      return;
    }
    const cleaned = lines.filter((l) => l.menu_item_id && l.qty > 0);
    if (!cleaned.length) {
      setErr("Add at least one item.");
      return;
    }

    createOrder.mutate(
      {
        delivery_type: deliveryType,
        address_id: deliveryType === "delivery" ? addressId : undefined,
        scheduled_ts: scheduledTs || undefined,
        notes: notes || undefined,
        items: cleaned.map(({ menu_item_id, qty, notes }) => ({ menu_item_id, qty, notes })),
      },
      {
        onSuccess: (orderId) => {
          router.push(`/orders/${orderId}`);
        },
        onError: () => setErr("Create order failed."),
      }
    );
  }

  return (
    <div className="w-screen px-6 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">New Order</h1>

      <section className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="delivery"
              checked={deliveryType === "pickup"}
              onChange={() => setDeliveryType("pickup")}
            />
            Pickup
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="delivery"
              checked={deliveryType === "delivery"}
              onChange={() => setDeliveryType("delivery")}
            />
            Delivery
          </label>
        </div>

        {deliveryType === "delivery" && (
          <input
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="Address ID"
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
          />
        )}

        <input
          className="border rounded-lg px-3 py-2 w-full"
          type="datetime-local"
          value={scheduledTs}
          onChange={(e) => setScheduledTs(e.target.value)}
        />

        <textarea
          className="border rounded-lg px-3 py-2 w-full"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="space-y-3">
          <div className="font-medium">Items</div>
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="border rounded-lg px-3 py-2 flex-1"
                placeholder="menu_item_id"
                value={l.menu_item_id}
                onChange={(e) => updateLine(i, { menu_item_id: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2 w-24"
                type="number"
                min={1}
                max={99}
                value={l.qty}
                onChange={(e) => updateLine(i, { qty: Number(e.target.value) || 1 })}
              />
              <input
                className="border rounded-lg px-3 py-2 flex-[2]"
                placeholder="notes (optional)"
                value={l.notes ?? ""}
                onChange={(e) => updateLine(i, { notes: e.target.value || undefined })}
              />
              <button className="border rounded px-3" onClick={() => removeLine(i)}>
                Remove
              </button>
            </div>
          ))}
          <button className="border rounded px-3 py-1" onClick={addLine}>
            + Add item
          </button>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div>
          <button
            onClick={submit}
            disabled={createOrder.isPending}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {createOrder.isPending ? "Creating…" : "Create order"}
          </button>
        </div>
      </section>
    </div>
  );
}