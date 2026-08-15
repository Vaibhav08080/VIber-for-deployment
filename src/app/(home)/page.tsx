"use client";

import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectList } from "@/modules/home/ui/components/project-list";
import { CinematicBackground } from "@/components/cinematic-background";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const [parallax, setParallax] = useState({ rotateX: 0, rotateY: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      setParallax({
        rotateX: -y * 8,
        rotateY: x * 8,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const scrollToPrompt = () => {
    document.getElementById("prompt-builder")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-transparent text-[#090909] dark:text-[#e3e2e2] selection:bg-[#ab2f01] selection:text-[#ffc8b9] overflow-x-hidden transition-colors">
      {/* Interactive WebGL & Three.js Background */}
      <CinematicBackground />

      <main className="relative pt-24 md:pt-28 z-10">
        {/* 1. Hero Experience Section */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[640px] pb-16">
          {/* Hero Left Content */}
          <div className="flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#121414]/90 border border-neutral-200 dark:border-[#FF6A3D]/30 w-fit backdrop-blur-md shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#FF6A3D] animate-ping" />
              <span className="text-xs uppercase tracking-widest font-mono text-neutral-700 dark:text-[#c4c7c7] font-semibold">
                Editorial AI Engine 2.0
              </span>
            </div>

            <h1 className="font-['Sora'] text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-[1.05] tracking-tighter uppercase text-[#090909] dark:text-[#e3e2e2]">
              BUILD. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#090909] dark:from-[#e3e2e2] via-[#FF6A3D] to-[#ff9d7d]">
                WITHOUT LIMITS.
              </span>
            </h1>

            <p className="font-['Geist'] text-base sm:text-lg md:text-xl text-neutral-600 dark:text-[#c4c7c7] max-w-lg border-l-2 border-[#FF6A3D] pl-6 py-2 leading-relaxed">
              The elite AI engine for developers and creators who demand precision. Performance-tuned for the next generation of digital excellence.
            </p>

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={scrollToPrompt}
                className="bg-[#FF6A3D] text-white dark:text-[#3b0a00] px-8 py-4 rounded-xl font-['Geist'] text-xs font-extrabold tracking-widest uppercase hover:bg-[#ff8a6d] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,106,61,0.3)] flex items-center gap-2 cursor-pointer group"
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
            <div className="absolute top-0 right-0 w-[420px] h-[280px] bg-white/90 dark:bg-[#121414]/80 rounded-2xl border border-neutral-200 dark:border-[#444748]/40 shadow-xl dark:shadow-2xl overflow-hidden glass-panel backdrop-blur-xl">
              <div className="flex items-center gap-2 p-3 border-b border-neutral-200 dark:border-[#444748]/30 bg-neutral-50 dark:bg-[#0d0e0f]/50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="mx-auto bg-neutral-200 dark:bg-[#292a2a] px-4 py-0.5 rounded text-[10px] font-mono text-neutral-600 dark:text-[#8e9192]">
                  sparksite.dev/preview/active
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="h-4 bg-[#FF6A3D]/20 rounded w-3/4 animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-neutral-100 dark:bg-[#292a2a]/40 rounded-xl border border-neutral-200 dark:border-[#444748]/20 flex flex-col justify-end p-3">
                    <div className="h-2 bg-[#FF6A3D]/40 rounded w-1/2 mb-1" />
                    <div className="h-2 bg-neutral-300 dark:bg-[#444748]/40 rounded w-3/4" />
                  </div>
                  <div className="h-24 bg-neutral-100 dark:bg-[#292a2a]/40 rounded-xl border border-neutral-200 dark:border-[#444748]/20 flex flex-col justify-end p-3">
                    <div className="h-2 bg-[#FF6A3D]/40 rounded w-2/3 mb-1" />
                    <div className="h-2 bg-neutral-300 dark:bg-[#444748]/40 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Code Snippet Overlay (Crisp Dark Slate Box for high-end look) */}
            <div className="absolute bottom-12 left-4 w-[290px] p-4 rounded-xl border border-slate-700/80 font-mono text-xs shadow-2xl backdrop-blur-xl bg-[#0f172a] text-slate-100">
              <div className="flex justify-between items-center mb-3 border-b border-slate-700/60 pb-2">
                <span className="text-[#FF6A3D] font-semibold text-xs">sparksite.config.js</span>
                <span className="material-symbols-outlined text-slate-400 text-sm">terminal</span>
              </div>
              <pre className="text-slate-300 text-[11px] leading-relaxed">
                <span className="text-[#FF6A3D]">export default</span> &#123;<br />
                &nbsp;&nbsp;engine: <span className="text-amber-300">&apos;sparksite-ultra&apos;</span>,<br />
                &nbsp;&nbsp;precision: <span className="text-emerald-400">0.98</span>,<br />
                &nbsp;&nbsp;render: <span className="text-amber-300">&apos;cinematic&apos;</span><br />
                &#125;
              </pre>
            </div>

            {/* Mini Terminal Overlay */}
            <div className="absolute bottom-0 right-8 w-[330px] bg-[#090d16] p-4 rounded-xl border border-emerald-900/60 font-mono text-xs text-emerald-400 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-slate-400">$</span>
                <span className="text-white">sparksite deploy --live</span>
              </div>
              <div className="text-[#8e9192] text-[11px] space-y-1">
                <div>&gt; Optimizing cinematic assets...</div>
                <div>&gt; Syncing WebGL shader state...</div>
                <div className="text-[#FF6A3D] font-semibold pt-1">
                  ✓ Deployment live at sparksite.dev/p/4x
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

        {/* 2. SparkSite Editor (Prompt UI) */}
        <section id="prompt-builder" className="max-w-[1440px] mx-auto px-6 md:px-20 py-12 scroll-mt-32">
          <div className="text-center mb-8">
            <span className="text-xs uppercase font-mono tracking-[0.3em] text-[#FF6A3D]">
              Prompt Interface
            </span>
            <h2 className="font-['Sora'] text-2xl sm:text-3xl font-bold tracking-tight text-[#090909] dark:text-[#e3e2e2] mt-2">
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
        <section className="w-full overflow-hidden border-y border-neutral-200 dark:border-[#444748]/20 py-12 bg-neutral-100/80 dark:bg-[#0d0e0f]/50 backdrop-blur-sm my-16">
          <div className="flex animate-scroll whitespace-nowrap items-center gap-24">
            <div className="flex items-center gap-24 grayscale opacity-50 dark:opacity-40 hover:opacity-100 transition-opacity">
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#090909] dark:text-[#e3e2e2]">LINEAR</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#090909] dark:text-[#e3e2e2]">INNGEST</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#090909] dark:text-[#e3e2e2]">APPLE</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#090909] dark:text-[#e3e2e2]">VERCEL</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#090909] dark:text-[#e3e2e2]">STRIPE</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#090909] dark:text-[#e3e2e2]">FRAMER</span>
            </div>
            <div className="flex items-center gap-24 grayscale opacity-50 dark:opacity-40 hover:opacity-100 transition-opacity">
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#090909] dark:text-[#e3e2e2]">LINEAR</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#090909] dark:text-[#e3e2e2]">INNGEST</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#090909] dark:text-[#e3e2e2]">APPLE</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#090909] dark:text-[#e3e2e2]">VERCEL</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#090909] dark:text-[#e3e2e2]">STRIPE</span>
              <span className="font-['Sora'] text-2xl font-bold tracking-tighter text-[#090909] dark:text-[#e3e2e2]">FRAMER</span>
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
              <h2 className="font-['Sora'] text-4xl sm:text-5xl font-extrabold leading-tight text-[#090909] dark:text-[#e3e2e2] uppercase">
                AI Design <br />
                Engine.
              </h2>
              <p className="font-['Geist'] text-neutral-600 dark:text-[#c4c7c7] text-base sm:text-lg leading-relaxed max-w-md">
                SparkSite doesn&apos;t just write code; it architecturally understands intent. Using our proprietary Cinematic LLM, we generate high-fidelity layouts that respect your design system&apos;s soul.
              </p>
              <div className="pt-2">
                <button className="border border-neutral-300 dark:border-[#444748]/50 px-8 py-3.5 rounded-xl text-xs font-mono tracking-wider uppercase text-[#090909] dark:text-[#e3e2e2] hover:bg-neutral-100 dark:hover:bg-[#292a2a] transition-all cursor-pointer shadow-xs">
                  Documentation
                </button>
              </div>
            </div>

            <div className="relative aspect-video glass-panel rounded-2xl border border-neutral-200 dark:border-[#444748]/30 flex items-center justify-center p-8 overflow-hidden group shadow-xl dark:shadow-2xl bg-white dark:bg-[#121414]">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6A3D]/10 to-transparent" />
              <div className="w-full h-full border border-neutral-200 dark:border-[#444748]/20 rounded-xl bg-neutral-50 dark:bg-[#0d0e0f]/80 p-4 space-y-3 relative z-10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-[#444748]/50" />
                  <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-[#444748]/50" />
                </div>
                <div className="h-full border-t border-neutral-200 dark:border-[#444748]/20 grid grid-cols-6 grid-rows-6 gap-2 pt-3">
                  <div className="col-span-2 row-span-4 border border-neutral-200 dark:border-[#444748]/30 bg-neutral-200/60 dark:bg-[#292a2a]/30 rounded-lg group-hover:bg-[#FF6A3D]/20 transition-colors" />
                  <div className="col-span-4 row-span-2 border border-neutral-200 dark:border-[#444748]/30 bg-neutral-200/60 dark:bg-[#292a2a]/30 rounded-lg" />
                  <div className="col-span-4 row-span-4 border border-neutral-200 dark:border-[#444748]/30 bg-neutral-200/60 dark:bg-[#292a2a]/30 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Block 2: Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative aspect-square glass-panel rounded-2xl border border-neutral-200 dark:border-[#444748]/30 flex items-center justify-center p-12 overflow-hidden group shadow-xl dark:shadow-2xl bg-white dark:bg-[#121414]">
              <div className="absolute inset-0 bg-gradient-to-bl from-[#FF6A3D]/10 to-transparent" />
              <div className="w-full flex flex-col items-center gap-6 relative z-10">
                <div className="w-24 h-24 border border-[#FF6A3D]/40 rounded-full flex items-center justify-center animate-pulse bg-[#FF6A3D]/10">
                  <span className="material-symbols-outlined text-4xl text-[#FF6A3D]">
                    database
                  </span>
                </div>
                <div className="space-y-3 w-full text-center max-w-xs">
                  <div className="h-1.5 bg-neutral-200 dark:bg-[#292a2a] w-full rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF6A3D] w-1/3 animate-pulse" />
                  </div>
                  <span className="font-mono text-xs text-neutral-500 dark:text-[#8e9192]">
                    Synchronizing data nodes across 35 edges...
                  </span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-6 lg:pl-12">
              <span className="text-xs uppercase font-mono tracking-[0.4em] text-[#FF6A3D]">
                Performance
              </span>
              <h2 className="font-['Sora'] text-4xl sm:text-5xl font-extrabold leading-tight text-[#090909] dark:text-[#e3e2e2] uppercase">
                Global <br />
                Deployment.
              </h2>
              <p className="font-['Geist'] text-neutral-600 dark:text-[#c4c7c7] text-base sm:text-lg leading-relaxed max-w-md">
                Deploy your SparkSite-generated apps instantly to the edge. Our native integration with Vercel and AWS ensures sub-100ms response times globally.
              </p>
              <div className="pt-2">
                <button className="border border-neutral-300 dark:border-[#444748]/50 px-8 py-3.5 rounded-xl text-xs font-mono tracking-wider uppercase text-[#090909] dark:text-[#e3e2e2] hover:bg-neutral-100 dark:hover:bg-[#292a2a] transition-all cursor-pointer shadow-xs">
                  View Infrastructure
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Showcase Gallery */}
        <section id="showcase" className="max-w-[1440px] mx-auto px-6 md:px-20 py-20 scroll-mt-32">
          <div className="text-center max-w-xl mx-auto space-y-4 mb-16">
            <span className="text-xs uppercase font-mono tracking-[0.4em] text-[#FF6A3D]">
              Gallery
            </span>
            <h2 className="font-['Sora'] text-4xl font-extrabold text-[#090909] dark:text-[#e3e2e2] tracking-tight uppercase">
              Created With SparkSite
            </h2>
            <p className="font-['Geist'] text-neutral-600 dark:text-[#c4c7c7] text-base">
              The finest digital products, generated in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Showcase Card 1 — Ripple Testimonials */}
            <a
              href="https://ripple-testimonials.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl border border-neutral-200 dark:border-[#444748]/30 overflow-hidden bg-neutral-900 shadow-xl transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,106,61,0.15)] cursor-pointer block"
            >
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src="/Template1.png"
                  alt="Ripple Testimonials"
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
                {/* Live badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                  <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider">Live</span>
                </div>
              </div>
              <div className="p-8 absolute bottom-0 left-0 right-0 text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6A3D] bg-[#FF6A3D]/10 px-3 py-1 rounded-full border border-[#FF6A3D]/30">
                  Testimonials
                </span>
                <h3 className="font-['Sora'] text-2xl font-bold mt-3 group-hover:text-[#FF6A3D] transition-colors">
                  RIPPLE TESTIMONIALS
                </h3>
                <p className="text-xs text-white/50 mt-1 font-mono flex items-center gap-1">
                  ripple-testimonials.vercel.app
                  <svg className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </p>
              </div>
            </a>

            {/* Showcase Card 2 — Glam Cosmetics */}
            <a
              href="https://glam-cosmetics-universe-hqlr.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl border border-neutral-200 dark:border-[#444748]/30 overflow-hidden bg-neutral-900 shadow-xl transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,106,61,0.15)] cursor-pointer block"
            >
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src="/template2.png"
                  alt="Glam Cosmetics Universe"
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
                {/* Live badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                  <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider">Live</span>
                </div>
              </div>
              <div className="p-8 absolute bottom-0 left-0 right-0 text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6A3D] bg-[#FF6A3D]/10 px-3 py-1 rounded-full border border-[#FF6A3D]/30">
                  E-Commerce
                </span>
                <h3 className="font-['Sora'] text-2xl font-bold mt-3 group-hover:text-[#FF6A3D] transition-colors">
                  GLAM COSMETICS
                </h3>
                <p className="text-xs text-white/50 mt-1 font-mono flex items-center gap-1">
                  glam-cosmetics-universe-hqlr.vercel.app
                  <svg className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </p>
              </div>
            </a>
          </div>
        </section>

        {/* 7. Call To Action Footer Banner */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-20 py-24">
          <div className="relative rounded-3xl p-12 md:p-20 text-center overflow-hidden border border-neutral-800 bg-[#090909] text-white shadow-2xl">
            <div className="absolute inset-0 bg-radial from-[#FF6A3D]/20 via-transparent to-transparent opacity-60 pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="font-['Sora'] text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
                Ready to build <br />
                <span className="text-[#FF6A3D]">without boundaries?</span>
              </h2>
              <p className="font-['Geist'] text-neutral-400 text-lg">
                Join thousands of developers creating the future of the web with SparkSite AI.
              </p>
              <div className="pt-4 flex justify-center">
                <button
                  onClick={scrollToPrompt}
                  className="bg-[#FF6A3D] text-[#3b0a00] px-10 py-5 rounded-2xl font-['Geist'] text-xs font-extrabold tracking-widest uppercase hover:bg-[#ff8a6d] active:scale-95 transition-all shadow-[0_0_35px_rgba(255,106,61,0.4)] flex items-center gap-3 cursor-pointer"
                >
                  <span>Launch Editor</span>
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Footer */}
        <footer className="border-t border-neutral-200 dark:border-[#444748]/30 py-12 text-center text-xs font-mono text-neutral-500 dark:text-[#8e9192]">
          <div className="max-w-[1440px] mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="SparkSite Logo" width={20} height={20} className="brightness-110 dark:brightness-125" />
              <span className="font-['Sora'] font-bold text-neutral-900 dark:text-[#e3e2e2]">SparkSite AI Engine</span>
            </div>
            <div className="flex items-center gap-4">
              <span>© {new Date().getFullYear()} SparkSite Inc. All rights reserved.</span>
              <span>•</span>
              <a
                href="https://www.linkedin.com/in/vaibhavkumarprince/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#FF6A3D] text-[#090909] dark:text-[#e3e2e2] transition-colors underline underline-offset-4 flex items-center gap-1 font-semibold"
              >
                Made by Vaibhav
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}