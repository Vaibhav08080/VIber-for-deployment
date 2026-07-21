"use client";

import { PricingTable } from "@clerk/nextjs";
import Image from "next/image";
import { dark } from "@clerk/themes";
import { CinematicBackground } from "@/components/cinematic-background";

const PricingPage = () => {
  return (
    <div className="relative min-h-screen bg-[#090909] text-[#e3e2e2] flex flex-col items-center pt-12 pb-24 px-6">
      <CinematicBackground />

      <div className="flex flex-col max-w-4xl mx-auto w-full relative z-10 space-y-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Vibel Logo"
            width={48}
            height={48}
            className="brightness-125 hover:scale-105 transition-transform"
          />
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#FF6A3D]">
            Plans &amp; Subscriptions
          </span>
          <h1 className="font-['Sora'] text-4xl sm:text-5xl font-extrabold tracking-tight uppercase text-[#e3e2e2]">
            Build Without Limits
          </h1>
          <p className="font-['Geist'] text-[#c4c7c7] text-base max-w-md">
            Choose a plan tailored for your building velocity and global deployment requirements.
          </p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#444748]/30 shadow-2xl backdrop-blur-xl">
          <PricingTable
            appearance={{
              baseTheme: dark,
              elements: {
                cardbox: "border! border-[#444748]/40! shadow-2xl! rounded-2xl! bg-[#121414]/90!",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
