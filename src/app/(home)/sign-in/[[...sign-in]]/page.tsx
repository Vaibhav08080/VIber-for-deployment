"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { CinematicBackground } from "@/components/cinematic-background";

const SignInPage = () => {
  return (
    <div className="relative min-h-screen bg-[#090909] text-[#e3e2e2] flex flex-col items-center justify-center py-12 px-6">
      <CinematicBackground />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center space-y-6">
        <SignIn
          appearance={{
            baseTheme: dark,
            elements: {
              card: "border! border-[#444748]/40! shadow-2xl! rounded-2xl! bg-[#121414]/90! backdrop-blur-xl",
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignInPage;
