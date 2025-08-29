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
    <div className="home-container w-screen min-h-scree">
      <div className="home-hero bg-[url('/havenia-bg.JPG')] bg-black/40 bg-blend-overlay">
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
