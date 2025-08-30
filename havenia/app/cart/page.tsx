"use client";
import { useCart } from "@/components/cart/CartProvider";
import { useCreateOrder } from "@/hooks/orders";
import ClientNav from "@/components/ClientNav";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, setQty, remove, clear } = useCart();
  const createOrder = useCreateOrder();

  async function checkoutPickup() {
    if (items.length === 0) return;

    try {
      const order = await createOrder.mutateAsync({
        delivery_type: "pickup",
        items: items.map(i => ({ menu_item_id: i.id, qty: i.qty })),
      });

      clear();
      // Go to an order confirmation page (you already have GET /orders/:id)
      router.push(`me/orders`);
    } catch (e: any) {
      // Friendly errors based on your controller:
      const msg =
        e?.response?.data?.error?.message ||
        e?.message ||
        "Failed to create order.";
      alert(msg);
    }
  }

  return (
    <div className="w-screen min-h-screen bg-amber-700">
      <ClientNav />
      <main className="max-w-5xl mx-auto px-4 py-8 text-black">
        <h1 className="text-2xl font-semibold mb-6 text-white">Your Order</h1>

        {items.length === 0 ? (
          <p className="text-white/90">
            Your cart is empty. <Link className="underline" href="/menu">Browse the menu</Link>.
          </p>
        ) : (
          <>
            <ul className="bg-white rounded-xl shadow divide-y">
              {items.map(i => (
                <li key={i.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{i.name}</div>
                    <div className="text-sm text-neutral-600">
                      {Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(i.price)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={i.qty}
                      onChange={(e) => setQty(i.id, Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 border rounded px-2 py-1"
                    />
                    <button className="text-sm border rounded px-3 py-1" onClick={() => remove(i.id)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 bg-white rounded-xl shadow p-4 flex items-center justify-between">
              <div className="font-semibold">
                Subtotal: {Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(subtotal)}
              </div>
              <div className="flex items-center gap-2">
                <button className="border rounded px-3 py-2" onClick={clear} disabled={createOrder.isPending}>
                  Clear
                </button>
                <button
                  className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
                  disabled={createOrder.isPending}
                  onClick={checkoutPickup}
                >
                  {createOrder.isPending ? "Placing…" : "Checkout (pickup)"}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}