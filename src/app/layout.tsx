import type { Metadata } from "next";
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
  title: "Vibel",
  description: "Create websites by chatting with AI prompts. Instantly generate lovable, modern web apps using Vibel.",
  keywords: [
    "AI website builder",
    "AI web app generator",
    "prompt to website",
    "Next.js app builder",
    "Vibel",
    "create website with AI",
    "no code website builder",
    "lovable websites"
  ],
  openGraph: {
    title: "Vibel | AI Website Builder",
    description: "Create websites by chatting with AI prompts. Instantly generate lovable, modern web apps using Vibel.",
    url: "https://vibel.app/",
    siteName: "Vibel",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "Vibel Logo"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibel | AI Website Builder",
    description: "Create websites by chatting with AI prompts. Instantly generate lovable, modern web apps using Vibel.",
    images: ["/logo.svg"],
    creator: "@yourtwitterhandle"
  },
  themeColor: "#C96342",
  alternates: {
    canonical: "https://vibel.app/"
  }
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider 
        attribute="class"
        defaultTheme="system"
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
