"use client";

import Link from "next/link";
import { useActivities } from "@/hooks/activities";
import ClientNav from "@/components/ClientNav";

export default function ActivitiesPage() {
  const { data, isLoading, error } = useActivities(); // add params if you want to filter

  if (isLoading) return <p className="p-6">Loading activities…</p>;
  if (error) return <p className="p-6 text-red-600">Failed to load activities.</p>;

  return (
    <div className="w-screen px-6 py-8">
      <ClientNav />
      
      <h1 className="text-2xl font-semibold mb-6">Activities</h1>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data!.map((a) => {
          const price = Number(a.base_price);
          return (
            <li key={a.id} className="bg-white rounded-xl border shadow-sm p-4">
              <h2 className="font-medium">{a.name}</h2>
              <p className="text-sm text-neutral-600 line-clamp-3">{a.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm">
                  {price.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                </span>
                <Link
                  href={`/activities/${a.id}`}
                  className="text-sm border rounded px-3 py-1 hover:bg-neutral-50"
                >
                  View
                </Link>
              </div>
              {a.upcoming_sessions != null && (
                <div className="mt-2 text-xs text-neutral-500">
                  Upcoming sessions: {a.upcoming_sessions}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}