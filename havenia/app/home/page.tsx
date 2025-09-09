// app/home
"use client";

import AquaVibe from "@/components/AquaVibe";
import ClientNav from "@/components/ClientNav";
import Company from "@/components/Company";
import DiveDine from "@/components/DiveDine";
import Hero from "@/components/Hero";
import IslandSync from "@/components/IslandSync";

export default function HomePage() {
  return (
    <div className="home-container w-screen min-h-screen">
      <div className="home-hero md:bg-cover md:bg-[100%] lg:bg-cover lg:bg-bottom-right bg-[url('/havenia-bg.JPG')] bg-black/40 bg-blend-overlay">
        <ClientNav />
        <Hero />
        <IslandSync />
        <AquaVibe />
        <DiveDine />
        <Company />
      </div>
    </div>
  );
}
