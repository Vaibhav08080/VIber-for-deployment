"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CinematicBackground } from "@/components/cinematic-background";
import { Navbar } from "@/modules/home/ui/components/navbar";
import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectList } from "@/modules/home/ui/components/project-list";

export default function LandingPage() {
  const [parallax, setParallax] = useState({ rotateX: 0, rotateY: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const xAxis = (window.innerWidth / 2 - e.clientX) / 40;
      const yAxis = (window.innerHeight / 2 - e.clientY) / 40;
      setParallax({ rotateX: yAxis, rotateY: xAxis });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const scrollToPrompt = () => {
    const promptElem = document.getElementById("prompt-builder");
    if (promptElem) {
      promptElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent text-[#090909] dark:text-[#e3e2e2] selection:bg-[#ab2f01] selection:text-[#ffc8b9] overflow-x-hidden transition-colors">
      {/* Interactive WebGL & Three.js Background */}
      <CinematicBackground />

      <main className="relative pt-[120px] md:pt-[140px] z-10">
        {/* 1. Hero Experience Section */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[640px] pb-16">
          {/* Hero Left Content */}
          <div className="flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#121414]/90 border border-black/10 dark:border-[#FF6A3D]/30 w-fit backdrop-blur-md shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#FF6A3D] animate-ping" />
              <span className="text-xs uppercase tracking-widest font-mono text-[#525252] dark:text-[#c4c7c7]">
                Editorial AI Engine 2.0
              </span>
            </div>

            <h1 className="font-['Sora'] text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-[1.05] tracking-tighter uppercase text-[#090909] dark:text-[#e3e2e2]">
              BUILD. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#090909] dark:from-[#e3e2e2] via-[#FF6A3D] to-[#ff9d7d]">
                WITHOUT LIMITS.
              </span>
            </h1>

            <p className="font-['Geist'] text-base sm:text-lg md:text-xl text-[#525252] dark:text-[#c4c7c7] max-w-lg border-l-2 border-[#FF6A3D] pl-6 py-2 leading-relaxed">
              The elite AI engine for developers and creators who demand precision. Performance-tuned for the next generation of digital excellence.
            </p>

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={scrollToPrompt}
                className="bg-[#FF6A3D] text-[#3b0a00] px-8 py-4 rounded-xl font-['Geist'] text-xs font-extrabold tracking-widest uppercase hover:bg-[#ff8a6d] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,106,61,0.3)] flex items-center gap-2 cursor-pointer group"
              >
                <span>Start Building</span>
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Hero Right Interactive 3D Parallax Developer Art Piece */}
          <div
            className="relative h-[480px] hidden lg:block parallax-hero perspective-1000"
            style={{
              transform: `rotateY(${parallax.rotateY}deg) rotateX(${parallax.rotateX}deg)`,
            }}
          >
            {/* Glass Browser Wireframe */}
            <div className="absolute top-0 right-0 w-[420px] h-[280px] bg-[#121414]/80 rounded-2xl border border-[#444748]/40 shadow-2xl overflow-hidden glass-panel backdrop-blur-xl">
              <div className="flex items-center gap-2 p-3 border-b border-[#444748]/30 bg-[#0d0e0f]/50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <div className="mx-auto bg-[#292a2a] px-4 py-0.5 rounded text-[10px] font-mono text-[#8e9192]">
                  vibel.app/preview/active
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="h-4 bg-[#FF6A3D]/20 rounded w-3/4 animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-[#292a2a]/40 rounded-xl border border-[#444748]/20 flex flex-col justify-end p-3">
                    <div className="h-2 bg-[#FF6A3D]/40 rounded w-1/2 mb-1" />
                    <div className="h-2 bg-[#444748]/40 rounded w-3/4" />
                  </div>
                  <div className="h-24 bg-[#292a2a]/40 rounded-xl border border-[#444748]/20 flex flex-col justify-end p-3">
                    <div className="h-2 bg-[#FF6A3D]/40 rounded w-2/3 mb-1" />
                    <div className="h-2 bg-[#444748]/40 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Code Snippet Overlay */}
            <div className="absolute bottom-12 left-4 w-[290px] p-4 glass-panel rounded-xl border border-[#444748]/50 font-mono text-xs shadow-2xl backdrop-blur-xl bg-[#0d0e0f]/85">
              <div className="flex justify-between items-center mb-3 border-b border-[#444748]/30 pb-2">
                <span className="text-[#FF6A3D] font-semibold text-xs">vibel.config.js</span>
                <span className="material-symbols-outlined text-[#8e9192] text-sm">terminal</span>
              </div>
              <pre className="text-[#c4c7c7] text-[11px] leading-relaxed">
                <span className="text-[#FF6A3D]">export default</span> &#123;<br />
                &nbsp;&nbsp;engine: <span className="text-amber-300">&apos;vibel-ultra&apos;</span>,<br />
                &nbsp;&nbsp;precision: <span className="text-emerald-400">0.98</span>,<br />
                &nbsp;&nbsp;render: <span className="text-amber-300">&apos;cinematic&apos;</span><br />
                &#125;
              </pre>
            </div>

            {/* Mini Terminal Overlay */}
            <div className="absolute bottom-0 right-8 w-[330px] bg-[#090909]/95 p-4 rounded-xl border border-[#FF6A3D]/30 font-mono text-xs text-emerald-400/90 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#8e9192]">$</span>
                <span className="text-[#e3e2e2]">vibel deploy --live</span>
              </div>
              <div className="text-[#8e9192] text-[11px] space-y-1">
                <div>&gt; Optimizing cinematic assets...</div>
                <div>&gt; Syncing WebGL shader state...</div>
                <div className="text-[#FF6A3D] font-semibold pt-1">
                  ✓ Deployment live at vibel.io/p/4x
                </div>
              </div>
            </div>

            {/* Floating Energy Node */}
            <div className="absolute top-1/2 left-1/3 w-9 h-9 rounded-full bg-[#FF6A3D] shadow-[0_0_25px_rgba(255,106,61,0.6)] flex items-center justify-center animate-bounce">
              <span className="material-symbols-outlined text-[#3b0a00] text-lg font-bold">
                bolt
              </span>
            </div>
          </div>
        </section>

        {/* 2. Vibel Editor (Prompt UI) */}
        <section id="prompt-builder" className="max-w-[1440px] mx-auto px-6 md:px-20 py-12 scroll-mt-32">
          <div className="text-center mb-8">
            <span className="text-xs uppercase font-mono tracking-[0.3em] text-[#FF6A3D]">
              Prompt Interface
            </span>
            <h2 className="font-['Sora'] text-2xl sm:text-3xl font-bold tracking-tight text-[#e3e2e2] mt-2">
              Describe Your Vision in Natural Language
            </h2>
          </div>
          <ProjectForm />
        </section>

        {/* 3. Signed In User Projects */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-20">
          <ProjectList />
        </section>

        {/* 4. Trust & Social Proof Marquee */}
        <section className="w-full overflow-hidden border-y border-[#444748]/20 py-12 bg-[#0d0e0f]/50 backdrop-blur-sm my-16">
          <div className="flex animate-scroll whitespace-nowrap items-center gap-24">
            <div className="flex items-center gap-24 grayscale opacity-40 hover:opacity-100 transition-opacity">
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#e3e2e2]">LINEAR</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#e3e2e2]">INNGEST</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#e3e2e2]">APPLE</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#e3e2e2]">VERCEL</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#e3e2e2]">STRIPE</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#e3e2e2]">FRAMER</span>
            </div>
            <div className="flex items-center gap-24 grayscale opacity-40 hover:opacity-100 transition-opacity">
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#e3e2e2]">LINEAR</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#e3e2e2]">INNGEST</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#e3e2e2]">APPLE</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#e3e2e2]">VERCEL</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#e3e2e2]">STRIPE</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#e3e2e2]">FRAMER</span>
            </div>
          </div>
        </section>

        {/* 5. Editorial Feature Split Blocks */}
        <section id="platform" className="max-w-[1440px] mx-auto px-6 md:px-20 py-20 space-y-36">
          {/* Feature Block 1: Architecture */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="text-xs uppercase font-mono tracking-[0.4em] text-[#FF6A3D]">
                Architecture
              </span>
              <h2 className="font-['Sora'] text-4xl sm:text-5xl font-extrabold leading-tight text-[#e3e2e2] uppercase">
                AI Design <br />
                Engine.
              </h2>
              <p className="font-['Geist'] text-[#c4c7c7] text-base sm:text-lg leading-relaxed max-w-md">
                Vibel doesn&apos;t just write code; it architecturally understands intent. Using our proprietary Cinematic LLM, we generate high-fidelity layouts that respect your design system&apos;s soul.
              </p>
              <div className="pt-2">
                <button className="border border-[#444748]/50 px-8 py-3.5 rounded-xl text-xs font-mono tracking-wider uppercase text-[#e3e2e2] hover:bg-[#292a2a] transition-all cursor-pointer">
                  Documentation
                </button>
              </div>
            </div>

            <div className="relative aspect-video glass-panel rounded-2xl border border-[#444748]/30 flex items-center justify-center p-8 overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6A3D]/10 to-transparent" />
              <div className="w-full h-full border border-[#444748]/20 rounded-xl bg-[#0d0e0f]/80 p-4 space-y-3 relative z-10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#444748]/50" />
                  <div className="w-3 h-3 rounded-full bg-[#444748]/50" />
                </div>
                <div className="h-full border-t border-[#444748]/20 grid grid-cols-6 grid-rows-6 gap-2 pt-3">
                  <div className="col-span-2 row-span-4 border border-[#444748]/30 bg-[#292a2a]/30 rounded-lg group-hover:bg-[#FF6A3D]/20 transition-colors" />
                  <div className="col-span-4 row-span-2 border border-[#444748]/30 bg-[#292a2a]/30 rounded-lg" />
                  <div className="col-span-4 row-span-4 border border-[#444748]/30 bg-[#292a2a]/30 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Block 2: Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative aspect-square glass-panel rounded-2xl border border-[#444748]/30 flex items-center justify-center p-12 overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-bl from-[#FF6A3D]/10 to-transparent" />
              <div className="w-full flex flex-col items-center gap-6 relative z-10">
                <div className="w-24 h-24 border border-[#FF6A3D]/40 rounded-full flex items-center justify-center animate-pulse bg-[#ab2f01]/10">
                  <span className="material-symbols-outlined text-4xl text-[#FF6A3D]">
                    database
                  </span>
                </div>
                <div className="space-y-3 w-full text-center max-w-xs">
                  <div className="h-1.5 bg-[#292a2a] w-full rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF6A3D] w-1/3 animate-pulse" />
                  </div>
                  <span className="font-mono text-xs text-[#8e9192]">
                    Synchronizing data nodes across 35 edges...
                  </span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-6 lg:pl-12">
              <span className="text-xs uppercase font-mono tracking-[0.4em] text-[#FF6A3D]">
                Performance
              </span>
              <h2 className="font-['Sora'] text-4xl sm:text-5xl font-extrabold leading-tight text-[#e3e2e2] uppercase">
                Global <br />
                Deployment.
              </h2>
              <p className="font-['Geist'] text-[#c4c7c7] text-base sm:text-lg leading-relaxed max-w-md">
                Deploy your Vibel-generated apps instantly to the edge. Our native integration with Vercel and AWS ensures sub-100ms response times globally.
              </p>
              <div className="pt-2">
                <button className="border border-[#444748]/50 px-8 py-3.5 rounded-xl text-xs font-mono tracking-wider uppercase text-[#e3e2e2] hover:bg-[#292a2a] transition-all cursor-pointer">
                  View Infrastructure
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Showcase Gallery */}
        <section id="showcase" className="max-w-[1440px] mx-auto px-6 md:px-20 py-24">
          <div className="mb-16 text-center space-y-3">
            <span className="text-xs uppercase font-mono tracking-[0.3em] text-[#FF6A3D]">
              Gallery
            </span>
            <h3 className="font-['Sora'] text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight uppercase text-[#e3e2e2]">
              Created with Vibel
            </h3>
            <p className="font-['Geist'] text-[#8e9192] text-base">
              The finest digital products, generated in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Project Card 1 */}
            <div className="group relative aspect-[16/10] bg-[#1a1c1c] border border-[#444748]/30 rounded-2xl overflow-hidden hover:border-[#FF6A3D]/50 transition-all duration-500 shadow-2xl">
              <Image
                src="/showcase/aurora.jpg"
                alt="Aurora Capital Showcase"
                fill
                className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/40 to-transparent flex flex-col justify-end p-8">
                <span className="text-xs font-mono text-[#FF6A3D] uppercase tracking-widest mb-1 font-semibold">
                  Fintech
                </span>
                <h4 className="font-['Sora'] text-2xl font-bold text-[#e3e2e2] tracking-tight">
                  AURORA CAPITAL
                </h4>
              </div>
            </div>

            {/* Project Card 2 */}
            <div className="group relative aspect-[16/10] bg-[#1a1c1c] border border-[#444748]/30 rounded-2xl overflow-hidden hover:border-[#FF6A3D]/50 transition-all duration-500 shadow-2xl">
              <Image
                src="/showcase/tempora.jpg"
                alt="Tempora Watches Showcase"
                fill
                className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/40 to-transparent flex flex-col justify-end p-8">
                <span className="text-xs font-mono text-[#FF6A3D] uppercase tracking-widest mb-1 font-semibold">
                  Retail
                </span>
                <h4 className="font-['Sora'] text-2xl font-bold text-[#e3e2e2] tracking-tight">
                  TEMPORA WATCHES
                </h4>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Final Call to Action */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-20 py-20 mb-12 text-center">
          <div className="glass-panel py-20 px-8 rounded-3xl border border-[#444748]/30 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[#FF6A3D] to-transparent opacity-40" />

            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="font-['Sora'] text-4xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tighter leading-tight text-[#e3e2e2]">
                Ready to build <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e3e2e2] to-[#FF6A3D]">
                  the future?
                </span>
              </h2>
              <p className="font-['Geist'] text-[#c4c7c7] text-base sm:text-lg">
                Join the 10,000+ elite developers building the cinematic web with Vibel.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                <button
                  onClick={scrollToPrompt}
                  className="w-full sm:w-auto bg-[#FF6A3D] text-[#3b0a00] px-10 py-4 rounded-full font-['Geist'] text-xs uppercase tracking-widest font-extrabold hover:bg-[#ff8a6d] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,106,61,0.3)] cursor-pointer"
                >
                  CREATE ACCOUNT
                </button>
                <button className="w-full sm:w-auto border border-[#444748]/50 px-10 py-4 rounded-full font-['Geist'] text-xs uppercase tracking-widest font-semibold text-[#e3e2e2] hover:bg-[#292a2a] transition-colors cursor-pointer">
                  TALK TO SALES
                </button>
              </div>
            </div>

            {/* Glowing blur decorations */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#FF6A3D]/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#FF6A3D]/10 rounded-full blur-[100px] pointer-events-none" />
          </div>
        </section>
      </main>

      {/* 8. Footer Shell */}
      <footer className="w-full py-16 bg-[#090909] border-t border-[#444748]/20 relative z-10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-20 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-3 items-center md:items-start">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt="Vibel Logo" width={26} height={26} className="brightness-125" />
              <span className="font-['Sora'] text-2xl font-bold text-[#e3e2e2]">Vibel</span>
            </div>
            <p className="font-['Geist'] text-xs text-[#8e9192] max-w-[280px] text-center md:text-left">
              Built for the cinematic web. The elite AI engine for precision creators.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 items-center text-xs font-['Geist']">
            <Link href="#platform" className="text-[#8e9192] hover:text-[#FF6A3D] transition-colors">
              Documentation
            </Link>
            <Link href="#templates" className="text-[#8e9192] hover:text-[#FF6A3D] transition-colors">
              Changelog
            </Link>
            <Link href="/pricing" className="text-[#8e9192] hover:text-[#FF6A3D] transition-colors">
              Pricing
            </Link>
            <Link href="#" className="text-[#8e9192] hover:text-[#FF6A3D] transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-[#8e9192] hover:text-[#FF6A3D] transition-colors">
              Privacy
            </Link>
          </div>

          <div className="font-['Geist'] text-xs text-[#8e9192]">
            © {new Date().getFullYear()} Vibel AI. Built for the cinematic web.
          </div>
        </div>
      </footer>
    </div>
  );
}