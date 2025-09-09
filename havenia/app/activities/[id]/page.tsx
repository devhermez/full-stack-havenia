// app/activities/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useActivity,
  useActivitySessions,
  useCreateBooking,
} from "@/hooks/activities";
import { useMemo, useState } from "react";
import { getToken } from "@/lib/auth";
import ClientNav from "@/components/ClientNav";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: activity, isLoading: loadingA, error: errA } = useActivity(id);
  const { data: sessions, isLoading: loadingS, error: errS } = useActivitySessions(id);
  const createBooking = useCreateBooking(id);

  const [selectedSession, setSelectedSession] = useState("");
  const [ackWaiver, setAckWaiver] = useState(false);
  const [age, setAge] = useState<string>("");
  const authed = useMemo(() => !!getToken(), []);

  if (loadingA || loadingS) return <p className="p-6">Loading…</p>;
  if (errA || errS) return <p className="p-6 text-red-600">Failed to load.</p>;
  if (!activity) return <p className="p-6">Not found.</p>;

  const priceDisplay = Number(activity.base_price).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

  const needsWaiver = activity.requires_waiver;
  const minAge = activity.min_age ?? undefined;

  const canBook =
    !!selectedSession &&
    (!needsWaiver || ackWaiver) &&
    (!minAge || (age !== "" && Number(age) >= minAge)) &&
    !createBooking.isPending;

  async function book() {
    if (!authed) { router.push("/login"); return; }
    if (!selectedSession) return;

    createBooking.mutate({
      session_id: selectedSession,
      acknowledged_waiver: needsWaiver ? true : undefined,
      participant_age: age ? Number(age) : undefined,
    });
  }

  return (
    <div className="w-screen min-h-screen text-black bg-gradient-to-r from-blue-900 to-cyan-700 ">
      <ClientNav />
      <div className="px-4 py-12 w-full flex flex-col gap-4 justify-center items-center">
        <section className="bg-white w-full max-w-4xl rounded-xl border shadow-sm p-6">
          <h1 className="text-2xl font-semibold">{activity.name}</h1>
          <p className="text-neutral-700 mt-2">{activity.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span>Type: {activity.type}</span>
            <span>Duration: {activity.duration_mins} mins</span>
            <span>Base price: {priceDisplay}</span>
            {minAge != null && <span>Min age: {minAge}</span>}
            {needsWaiver && <span className="text-amber-700">Waiver required</span>}
          </div>
        </section>

        <section className="w-full max-w-4xl bg-white rounded-xl border shadow-sm p-6">
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

          {/* Booking requirements */}
          <div className="mt-4 space-y-3">
            {typeof minAge === "number" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-700">Your age</label>
                <input
                  type="number"
                  min={minAge}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="border rounded px-2 py-1 text-sm w-24"
                />
              </div>
            )}

            {needsWaiver && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ackWaiver}
                  onChange={(e) => setAckWaiver(e.target.checked)}
                />
                I acknowledge the liability waiver.
              </label>
            )}

            <button
              disabled={!canBook}
              onClick={book}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              {createBooking.isPending ? "Booking…" : "Book selected session"}
            </button>

            {/* Surface server error message when present */}
            {"error" in createBooking && (createBooking as any)?.error?.response?.data?.error?.message && (
              <p className="text-sm text-red-600 mt-2">
                {(createBooking as any).error.response.data.error.message}
              </p>
            )}
            {createBooking.isError && !((createBooking as any)?.error?.response?.data?.error?.message) && (
              <p className="text-sm text-red-600 mt-2">Booking failed.</p>
            )}
            {createBooking.isSuccess && (
              <p className="text-sm text-green-700 mt-2">Booking created!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}