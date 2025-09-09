import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DiveDine() {
  return (
    <div className="ft1-container bg-white flex justify-center w-full h-screen items-center p-8">
      <div className="ft1-content w-full h-full rounded-tr-4xl rounded-br-4xl bg-cover bg-[position:10%] bg-[url('/divedine-bg.JPG')] bg-black/20 bg-blend-overlay flex flex-col justify-end items-start text-white p-4 gap-2">
        <h1 className="ft1-title text-4xl md:text-5xl lg:text-6xl metamorphous-regular">Dive&Dine</h1>
        <p className="ft1-description text-md md:w-[50ch] tinos-regular">
          Dive & Dine brings local flavors straight to your stay. From fresh
          seafood to comfort favorites, explore a curated menu that captures the
          essence of island living. Order with ease, enjoy doorstep delivery, or
          savor your meal by the shore — a dining experience as memorable as the
          view.
        </p>
        <Link href="/menu" className="bg-transparent flex p-2 gap-2 md:text-md lg:text-lg tinos-bold">
          Explore Dive&Dine <ArrowRight />
        </Link>
      </div>
    </div>
  );
}
