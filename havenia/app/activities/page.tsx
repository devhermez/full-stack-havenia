"use client";

import Link from "next/link";
import { useActivities } from "@/hooks/activities";
import ClientNav from "@/components/ClientNav";

export default function ActivitiesPage() {
  const { data, isLoading, error } = useActivities(); // add params if you want to filter

  if (isLoading) return <p className="p-6">Loading activities…</p>;
  if (error)
    return <p className="p-6 text-red-600">Failed to load activities.</p>;

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-cyan-500 0 to-blue-600 text-white">
      <ClientNav />
      <div className="activities-content p-8 flex flex-col w-full min-h-full md:p-8">
        <div className="px-2">
          <h1 className="text-2xl font-semibold mb-2 md:text-4xl lg:text-3xl">Activities</h1>
        <p className="text-white mb-4 tinos-regular">Make every moment unforgettable. Browse our exciting activities and book your next adventure today.</p>
        </div>

        <ul className="flex flex-col gap-4 md:flex md:flex-col md:justify-center lg:grid lg:grid-cols-2">
          {data!.map((a) => {
            const price = Number(a.base_price);
            const bg = a.image_url ? `url("${a.image_url}")` : undefined;
            return (
              <li
                key={a.id}
                className=" flex flex-col justify-between rounded-xl border shadow-sm p-4 bg-center bg-cover bg-no-repeat min-h-[220px] w-full md:min-h-[440px] md:flex md:flex-col md:justify-between bg-black/10 bg-blend-overlay text-shadow-lg"
                style={bg ? { backgroundImage: bg } : undefined}
              >
                {!bg && <div className="absolute inset-0 bg-black" />}
                <div>
                  <h2 className="font-medium text-lg md:text-4xl lg:text-2xl tinos-bold">{a.name}</h2>
                  <p className="text-xs line-clamp-3 md:text-2xl md:w-[50ch] lg:text-sm lg:w-auto">
                    {a.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm md:text-2xl lg:text-lg font-bold">
                    {price.toLocaleString(undefined, {
                      style: "currency",
                      currency: "USD",
                    })}
                  </span>
                  <Link
                    href={`/activities/${a.id}`}
                    className="text-sm border rounded px-3 py-1 hover:bg-neutral-50 md:text-2xl lg:text-sm"
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
    </div>
  );
}
