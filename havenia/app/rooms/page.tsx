// app/rooms/page.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import ClientNav from "@/components/ClientNav";

type Room = {
  id: string;
  property_id: string;
  name: string;
  capacity: number;
  price: string;
  created_at: string;
  image_url?: string;
  description?: string;
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ data: Room[] }>("/rooms", {
          params: { property_id: "57f55098-0537-4aca-a528-404b512c503b" }, // TODO: dynamic property_id
        });
        setRooms(data.data);
      } catch (e: any) {
        setErr(e?.response?.data?.error?.message ?? "Failed to load rooms");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="p-6">Loading rooms…</p>;
  if (err) return <p className="p-6 text-red-600">{err}</p>;

  return (
    <main className="w-screen min-h-screen bg-gradient-to-b from-green-700 to-white">
      <ClientNav />
      <div className="rooms-content flex flex-col p-6 w-screen md:justify-center md:items-start lg:min-h-200">
        <div className="">
          <h1 className="text-2xl font-semibold mb-2 text-white">
          Available Rooms
        </h1>
        <p className="text-white mb-4 tinos-regular">Make every moment unforgettable. Browse our exciting activities and book your next adventure today.</p>
        </div>
        {rooms.length === 0 ? (
          <p className="text-neutral-600">No rooms available.</p>
        ) : (
          <ul className="flex flex-col gap-6 text-white md:justify-evenly h-full w-full">
            {rooms.map((room) => {
              const bg = room.image_url
                ? `url("${room.image_url}")`
                : undefined;

              return (
                <li
                  key={room.id}
                  className="border h-[400px] flex flex-col justify-between w-auto rounded-lg p-4 shadow bg-center bg-cover bg-black/30 bg-blend-overlay"
                  style={{ backgroundImage: bg }}
                >
                  <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-medium md:text-3xl tinos-bold">{room.name}</h2>
                    <p className="text-sm md:text-lg lg:w-[50ch] text-neutral-200">{room.description}</p>
                  <p className="text-sm md:text-lg">Capacity: {room.capacity}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm lg:text-lg font-bold">${room.price}</p>
                  <Link
                    href={`/rooms/${room.id}`}
                    className="px-3 py-1 text-sm rounded-lg bg-white text-black flex justify-center items-center "
                  >
                    View details
                  </Link>
                  </div>
                  
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
