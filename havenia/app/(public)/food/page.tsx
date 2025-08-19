// app/(public)/food/page.tsx
export const dynamic = 'force-dynamic'; // always fetch fresh in dev

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: string | number; // Data API returns string; we can Number() it
  in_stock: boolean;
  category?: string | null;
};

async function getMenu(): Promise<MenuItem[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
  const res = await fetch(`${base}/api/v1/menu`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Menu fetch failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

export default async function FoodPage() {
  const items = await getMenu();

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Dive &amp; Dine — Menu</h1>

      {items.length === 0 ? (
        <p className="text-gray-500">No items yet.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((i) => (
            <li key={i.id} className="border rounded-xl p-4">
              <div className="font-medium">{i.name}</div>
              <div className="text-sm text-gray-500">{i.category ?? '—'}</div>
              <p className="mt-1 text-sm">{i.description}</p>
              <div className="mt-2 font-semibold">
                ₱{Number(i.price).toFixed(2)}
              </div>
              {!i.in_stock && <span className="text-xs text-red-500">Out of stock</span>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}