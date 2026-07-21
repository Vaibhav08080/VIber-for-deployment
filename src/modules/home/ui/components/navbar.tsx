"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { UserControl } from "@/components/user-control";

export const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[1440px] rounded-full z-50 glass-panel flex justify-between items-center px-6 md:px-8 py-3 border border-[#444748]/30 shadow-2xl backdrop-blur-xl bg-[#121414]/70">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-3 group">
        <Image src="/logo.svg" alt="Vibel Logo" width={28} height={28} className="brightness-125 group-hover:scale-105 transition-transform" />
        <span className="font-['Sora'] text-xl md:text-[24px] tracking-tighter text-[#e3e2e2] font-bold">
          Vibel
        </span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex gap-8 items-center">
        <Link
          href="/#platform"
          className={`text-xs uppercase tracking-widest transition-colors font-medium ${
            pathname === "/" ? "text-[#e3e2e2] font-semibold border-b border-[#FF6A3D] py-1" : "text-[#c4c7c7] hover:text-[#e3e2e2]"
          }`}
        >
          Platform
        </Link>
        <Link
          href="/#prompt-builder"
          className="text-xs uppercase tracking-widest text-[#c4c7c7] hover:text-[#e3e2e2] transition-colors font-medium"
        >
          Templates
        </Link>
        <Link
          href="/#showcase"
          className="text-xs uppercase tracking-widest text-[#c4c7c7] hover:text-[#e3e2e2] transition-colors font-medium"
        >
          Showcase
        </Link>
        <Link
          href="/pricing"
          className={`text-xs uppercase tracking-widest transition-colors font-medium ${
            pathname === "/pricing" ? "text-[#e3e2e2] font-semibold border-b border-[#FF6A3D] py-1" : "text-[#c4c7c7] hover:text-[#e3e2e2]"
          }`}
        >
          Pricing
        </Link>
      </div>

      {/* Auth Actions */}
      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-xs uppercase tracking-widest text-[#e3e2e2] opacity-80 hover:opacity-100 transition-opacity font-semibold cursor-pointer">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="bg-[#FF6A3D] text-[#3b0a00] px-6 py-2 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-[#ff8a6d] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,106,61,0.3)] cursor-pointer">
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
