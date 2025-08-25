"use client";

import { useParams, useRouter } from "next/navigation";
import { useActivity, useActivitySessions, useCreateBooking } from "@/hooks/activities";
import { useMemo, useState } from "react";
import { getToken } from "@/lib/auth";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: activity, isLoading: loadingA, error: errA } = useActivity(id);
  const { data: sessions, isLoading: loadingS, error: errS } = useActivitySessions(id);
  const createBooking = useCreateBooking(id);

  const [selectedSession, setSelectedSession] = useState<string>("");
  const authed = useMemo(() => !!getToken(), []);

  if (loadingA || loadingS) return <p className="p-6">Loading…</p>;
  if (errA || errS) return <p className="p-6 text-red-600">Failed to load.</p>;
  if (!activity) return <p className="p-6">Not found.</p>;

  const priceDisplay = Number(activity.base_price).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

  async function book() {
    if (!authed) {
      router.push("/login");
      return;
    }
    if (!selectedSession) return;

    // If you want to pass age/waiver:
    // { session_id: selectedSession, participant_age: 21, acknowledged_waiver: true }
    createBooking.mutate({ session_id: selectedSession });
  }

  return (
    <div className="w-screen px-6 py-8 space-y-8">
      <section className="bg-white rounded-xl border shadow-sm p-6">
        <h1 className="text-2xl font-semibold">{activity.name}</h1>
        <p className="text-neutral-700 mt-2">{activity.description}</p>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span>Type: {activity.type}</span>
          <span>Duration: {activity.duration_mins} mins</span>
          <span>Base price: {priceDisplay}</span>
          {activity.min_age != null && <span>Min age: {activity.min_age}</span>}
          {activity.requires_waiver && <span className="text-amber-700">Waiver required</span>}
        </div>
      </section>

      <section className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-3">Sessions</h2>

        {sessions && sessions.length > 0 ? (
          <ul className="space-y-2">
            {sessions.map((s) => {
              const price = Number(s.price_override ?? activity.base_price);
              const seatsLeft = s.capacity - s.booked_count;
              return (
                <li key={s.id} className="flex items-center justify-between border rounded px-3 py-2">
                  <div className="text-sm">
                    <div>{new Date(s.start_ts).toLocaleString()}</div>
                    <div className="text-neutral-600">
                      Seats left: {seatsLeft} / {s.capacity} ·{" "}
                      {price.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    </div>
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="session"
                      value={s.id}
                      checked={selectedSession === s.id}
                      onChange={() => setSelectedSession(s.id)}
                    />
                    Select
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-neutral-600">No sessions available.</p>
        )}

        <div className="mt-4">
          <button
            disabled={!selectedSession || createBooking.isPending}
            onClick={book}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {createBooking.isPending ? "Booking…" : "Book selected session"}
          </button>

          {createBooking.isError && (
            <p className="text-sm text-red-600 mt-2">Booking failed.</p>
          )}
          {createBooking.isSuccess && (
            <p className="text-sm text-green-700 mt-2">Booking created!</p>
          )}
        </div>
      </section>
    </div>
  );
}