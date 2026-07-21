"use client";

import { PricingTable } from "@clerk/nextjs";
import Image from "next/image";
import { dark } from "@clerk/themes";
import { CinematicBackground } from "@/components/cinematic-background";
import { useTheme } from "next-themes";

const PricingPage = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="relative min-h-screen bg-transparent text-[#090909] dark:text-[#e3e2e2] flex flex-col items-center pt-12 pb-24 px-6 transition-colors">
      <CinematicBackground />

      <div className="flex flex-col max-w-4xl mx-auto w-full relative z-10 space-y-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Vibel Logo"
            width={48}
            height={48}
            className="brightness-110 dark:brightness-125 hover:scale-105 transition-transform"
          />
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#FF6A3D]">
            Plans &amp; Subscriptions
          </span>
          <h1 className="font-['Sora'] text-4xl sm:text-5xl font-extrabold tracking-tight uppercase text-[#090909] dark:text-[#e3e2e2]">
            Build Without Limits
          </h1>
          <p className="font-['Geist'] text-neutral-600 dark:text-[#c4c7c7] text-base max-w-md">
            Choose a plan tailored for your building velocity and global deployment requirements.
          </p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-black/10 dark:border-[#444748]/30 shadow-xl dark:shadow-2xl backdrop-blur-xl bg-white dark:bg-[#121414]/90">
          <PricingTable
            appearance={{
              baseTheme: isDark ? dark : undefined,
              elements: {
                cardbox: "border! border-black/10! dark:border-[#444748]/40! shadow-xl! rounded-2xl!",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
