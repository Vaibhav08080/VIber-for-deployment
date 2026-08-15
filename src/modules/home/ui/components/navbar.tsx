"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { UserControl } from "@/components/user-control";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "lucide-react";
import { useState, useEffect } from "react";

export const Navbar = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[1440px] rounded-full z-50 flex justify-between items-center px-6 md:px-8 py-3 border border-neutral-200/80 dark:border-[#444748]/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-[#121414]/80 transition-colors">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-3 group">
        <Image src="/logo.svg" alt="SparkSite Logo" width={28} height={28} className="brightness-110 dark:brightness-125 group-hover:scale-105 transition-transform" />
        <span className="font-['Sora'] text-xl md:text-[24px] tracking-tighter text-[#090909] dark:text-[#e3e2e2] font-bold">
          SparkSite
        </span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex gap-8 items-center">
        <Link
          href="/#platform"
          className={`text-xs uppercase tracking-widest transition-colors font-medium ${
            pathname === "/" ? "text-[#090909] dark:text-[#e3e2e2] font-bold border-b-2 border-[#FF6A3D] py-0.5" : "text-neutral-600 dark:text-neutral-400 hover:text-[#090909] dark:hover:text-[#e3e2e2]"
          }`}
        >
          Platform
        </Link>
        <Link
          href="/#showcase"
          className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-400 hover:text-[#090909] dark:hover:text-[#e3e2e2] transition-colors font-medium"
        >
          Showcase
        </Link>
        <Link
          href="/pricing"
          className={`text-xs uppercase tracking-widest transition-colors font-medium ${
            pathname === "/pricing" ? "text-[#090909] dark:text-[#e3e2e2] font-bold border-b-2 border-[#FF6A3D] py-0.5" : "text-neutral-600 dark:text-neutral-400 hover:text-[#090909] dark:hover:text-[#e3e2e2]"
          }`}
        >
          Pricing
        </Link>
        <a
          href="https://www.linkedin.com/in/vaibhavkumarprince/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs uppercase tracking-widest text-[#FF6A3D] hover:underline font-bold transition-all"
        >
          Made by Vaibhav
        </a>
      </div>

      {/* Actions & Auth */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Theme Toggle Button */}
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full border border-neutral-200 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-white/10 transition-all cursor-pointer"
            title="Toggle Light / Dark Theme"
          >
            {theme === "dark" ? (
              <SunIcon className="size-4 text-amber-400" />
            ) : (
              <MoonIcon className="size-4 text-slate-700" />
            )}
          </button>
        )}

        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-xs uppercase tracking-widest text-[#090909] dark:text-[#e3e2e2] hover:text-[#FF6A3D] transition-colors font-bold cursor-pointer">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="bg-[#FF6A3D] text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-extrabold hover:bg-[#ff7a52] active:scale-95 transition-all shadow-[0_4px_20px_rgba(255,106,61,0.35)] cursor-pointer">
              Get Started
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserControl ShowName />
        </SignedIn>
      </div>
    </nav>
  );
};
