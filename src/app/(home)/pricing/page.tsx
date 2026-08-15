"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { CinematicBackground } from "@/components/cinematic-background";
import { useState, useEffect } from "react";
import { CheckIcon, CrownIcon, ZapIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const PRO_PLAN = {
  name: "Pro",
  price: 499,
  currency: "₹",
  description: "For builders who ship fast",
  features: [
    "100 AI generations per 30 minutes",
    "Priority AI queue",
    "GitHub export & sync",
    "Supabase integration",
    "Custom domain support",
    "Advanced code editor",
    "Speech-to-prompt input",
    "Priority support",
  ],
};

const FREE_PLAN = {
  name: "Free",
  price: 0,
  currency: "₹",
  description: "Get started for free",
  features: [
    "5 AI generations per 30 minutes",
    "Standard AI queue",
    "Basic preview",
    "Community support",
  ],
};

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check current pro status from DB
  useEffect(() => {
    if (!isLoaded || !user) {
      setCheckingStatus(false);
      return;
    }
    fetch("/api/subscription-status")
      .then((r) => r.json())
      .then((d) => {
        setIsPro(d?.isPro === true);
      })
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, [user, isLoaded]);

  // Load Razorpay script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    setIsPaying(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        return;
      }

      // Create Razorpay order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        toast.error(err.error || "Failed to create order");
        return;
      }

      const { orderId, amount, currency, keyId } = await orderRes.json();

      // Open Razorpay checkout
      const options = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: String(amount),
        currency,
        name: "SparkSite",
        description: "Pro Plan — Unlimited AI Building",
        image: "/logo.svg",
        order_id: orderId,
        prefill: {
          name: user.fullName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
        },
        theme: {
          color: "#FF6A3D",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              setIsPro(true);
              toast.success(
                "🎉 Welcome to Pro! You now have 100 credits per 30 minutes."
              );
              router.refresh();
            } else {
              const err = await verifyRes.json();
              toast.error(err.error || "Payment verification failed");
            }
          } catch {
            toast.error("Payment verification error. Contact support.");
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
            toast.info("Payment cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on(
        "payment.failed",
        (resp: { error: { description: string } }) => {
          toast.error(resp.error?.description || "Payment failed");
          setIsPaying(false);
        }
      );
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Something went wrong. Please try again.");
      setIsPaying(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent text-[#090909] dark:text-[#e3e2e2] flex flex-col items-center pt-12 pb-24 px-6 transition-colors">
      <CinematicBackground />

      <div className="flex flex-col max-w-4xl mx-auto w-full relative z-10 space-y-8 text-center">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo.svg"
            alt="SparkSite Logo"
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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
          {/* Free Plan */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-black/10 dark:border-[#444748]/30 shadow-xl dark:shadow-2xl backdrop-blur-xl bg-white dark:bg-[#121414]/90 flex flex-col text-left">
            <div className="flex items-center gap-2 mb-2">
              <ZapIcon className="size-5 text-neutral-400" />
              <span className="font-semibold text-lg">{FREE_PLAN.name}</span>
            </div>
            <div className="text-4xl font-extrabold mb-1">
              {FREE_PLAN.currency}0{" "}
              <span className="text-base font-normal text-muted-foreground">/ forever</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{FREE_PLAN.description}</p>
            <ul className="space-y-2 mb-8 flex-1">
              {FREE_PLAN.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckIcon className="size-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="relative glass-panel p-6 sm:p-8 rounded-3xl border-2 border-[#FF6A3D]/60 shadow-2xl backdrop-blur-xl bg-white dark:bg-[#121414]/90 flex flex-col text-left overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-4 right-4 bg-[#FF6A3D] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Most Popular
            </div>

            <div className="flex items-center gap-2 mb-2">
              <CrownIcon className="size-5 text-[#FF6A3D]" />
              <span className="font-semibold text-lg">{PRO_PLAN.name}</span>
            </div>
            <div className="text-4xl font-extrabold mb-1">
              {PRO_PLAN.currency}
              {PRO_PLAN.price}{" "}
              <span className="text-base font-normal text-muted-foreground">/ one-time</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{PRO_PLAN.description}</p>
            <ul className="space-y-2 mb-8 flex-1">
              {PRO_PLAN.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckIcon className="size-4 text-[#FF6A3D] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {checkingStatus ? (
              <Button className="w-full" disabled>
                <Loader2Icon className="size-4 animate-spin" />
                Checking status...
              </Button>
            ) : isPro ? (
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white cursor-default"
                disabled
              >
                <CheckIcon className="size-4" /> Active — Pro Plan
              </Button>
            ) : (
              <Button
                className="w-full bg-[#FF6A3D] hover:bg-[#ff8a6d] text-white font-semibold shadow-lg transition-all"
                onClick={handleUpgrade}
                disabled={isPaying}
              >
                {isPaying ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CrownIcon className="size-4" />
                    Upgrade to Pro — ₹499
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Trust note */}
        <p className="text-xs text-muted-foreground mt-4">
          Payments powered by{" "}
          <span className="font-semibold text-[#FF6A3D]">Razorpay</span> · Secure &amp; encrypted · INR only
        </p>
      </div>
    </div>
  );
}
