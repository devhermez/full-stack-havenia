import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AquaVibe() {
  return (
    <div className="ft1-container bg-white flex justify-center w-full h-screen items-center p-8">
      <div className="ft1-content w-full h-full rounded-tl-4xl rounded-bl-4xl bg-cover bg-[position:80%_10%] bg-[url('/aquavibe-bg.JPG')] bg-black/20 bg-blend-overlay flex flex-col justify-end items-end text-white p-4 gap-2">
        <h1 className="ft1-title text-4xl md:text-5xl lg:text-6xl metamorphous-regular">AquaVibe</h1>
        <p className="ft1-description text-md text-end md:w-[50ch] tinos-regular">
          Dive into AquaVibe — where the ocean comes alive. From jet skis and
          parasailing to snorkeling and paddleboarding, experience the thrill of
          water adventures that match every vibe, whether you’re chasing
          adrenaline or pure relaxation.
        </p>
        <Link href="/activities" className="bg-transparent flex p-2 gap-2 md:text-md lg:text-lg tinos-bold">
           <ArrowLeft />Explore AquaVibe 
        </Link>
      </div>
    </div>
  );
}
