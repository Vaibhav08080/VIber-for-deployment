"use client";

export const dynamic = "force-dynamic";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { CinematicBackground } from "@/components/cinematic-background";
import { useTheme } from "next-themes";

const SignInPage = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="relative min-h-screen bg-transparent text-[#090909] dark:text-[#e3e2e2] flex flex-col items-center justify-center py-12 px-6 transition-colors">
      <CinematicBackground />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center space-y-6">
        <SignIn
          appearance={{
            baseTheme: isDark ? dark : undefined,
            elements: {
              card: "border! border-black/10! dark:border-[#444748]/40! shadow-2xl! rounded-2xl! bg-white! dark:bg-[#121414]/90! backdrop-blur-xl",
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignInPage;
