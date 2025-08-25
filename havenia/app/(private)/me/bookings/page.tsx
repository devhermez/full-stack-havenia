"use client";

import RequireAuth from "@/components/RequireAuth";
import { useCancelMyBooking, useMyActivityBookings } from "@/hooks/activities";

export default function MyBookingsPage() {
  return (
    <RequireAuth>
      <Content />
    </RequireAuth>
  );
}

function Content() {
  const { data, isLoading, error } = useMyActivityBookings();
  const cancelMut = useCancelMyBooking();

  if (isLoading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-600">Failed to load.</p>;

  return (
    <div className="w-screen px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">My Activity Bookings</h1>

      {data && data.length > 0 ? (
        <ul className="space-y-3">
          {data.map((b) => (
            <li key={b.id} className="border rounded p-4 bg-white flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{b.activity_name}</div>
                <div className="text-neutral-600">{new Date(b.start_ts).toLocaleString()}</div>
                <div className="mt-1 text-xs">
                  Status: {b.status} · Price:{" "}
                  {Number(b.price).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                </div>
              </div>
              <div>
                {b.status !== "canceled" && (
                  <button
                    onClick={() => cancelMut.mutate(b.id)}
                    disabled={cancelMut.isPending}
                    className="text-sm border rounded px-3 py-1"
                  >
                    {cancelMut.isPending ? "Canceling…" : "Cancel"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-600">No bookings yet.</p>
      )}
    </div>
  );
}