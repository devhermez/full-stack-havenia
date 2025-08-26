import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function IslandSync() {
  return (
    <div className="ft1-container bg-white flex justify-center w-full h-screen items-center p-8">
      <div className="ft1-content w-full h-full rounded-tr-4xl rounded-br-4xl bg-cover bg-center bg-[url('/islandsync-bg.JPG')] bg-black/20 bg-blend-overlay flex flex-col justify-end items-start text-white p-4 gap-2">
        <h1 className="ft1-title text-4xl">IslandSync</h1>
        <p className="ft1-description text-md">
          With IslandSync, booking your island escape is just a few clicks away.
          Explore rooms, check availability, and reserve your perfect getaway —
          stress-free and ready for unforgettable memories.
        </p>
        <Link href="" className="bg-transparent flex p-2 gap-2">
          Explore IslandSync <ArrowRight />
        </Link>
      </div>
    </div>
  );
}
