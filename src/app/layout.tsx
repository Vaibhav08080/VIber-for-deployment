import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sparksite.dev"),
  title: "SparkSite",
  description: "Create websites by chatting with AI prompts. Instantly generate lovable, modern web apps using SparkSite.",
  keywords: [
    "AI website builder",
    "AI web app generator",
    "prompt to website",
    "Next.js app builder",
    "SparkSite",
    "create website with AI",
    "no code website builder",
    "lovable websites"
  ],
  openGraph: {
    title: "SparkSite | AI Website Builder",
    description: "Create websites by chatting with AI prompts. Instantly generate lovable, modern web apps using SparkSite.",
    url: "https://sparksite.dev/",
    siteName: "SparkSite",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "SparkSite Logo"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SparkSite | AI Website Builder",
    description: "Create websites by chatting with AI prompts. Instantly generate lovable, modern web apps using SparkSite.",
    images: ["/logo.svg"],
    creator: "@yourtwitterhandle"
  },
  alternates: {
    canonical: "https://sparksite.dev/"
  }
};

export const viewport: Viewport = {
  themeColor: "#C96342",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
    appearance={{
        variables:{
            colorPrimary:"#C96342",
                
            },
        }
      }>
    <TRPCReactProvider>
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Geist:wght@400;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground selection:bg-[#ab2f01] selection:text-[#ffc8b9]`}
      >
        <ThemeProvider 
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster/>  
        {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
    </TRPCReactProvider>
    </ClerkProvider>
  );
}
