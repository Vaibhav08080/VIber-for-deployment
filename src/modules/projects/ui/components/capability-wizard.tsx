"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheckIcon,
  DatabaseIcon,
  FolderUpIcon,
  CreditCardIcon,
  BrainCircuitIcon,
  LayoutTemplateIcon,
  CheckIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

interface CapabilityChoice {
  id: keyof CapabilitySelections;
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresSupabase: boolean;
  badge?: string;
}

export interface CapabilitySelections {
  authentication: boolean;
  database: boolean;
  storage: boolean;
  payments: boolean;
  aiFeatures: boolean;
  frontendOnly: boolean;
}

interface Props {
  projectId: string;
  open: boolean;
  onComplete: (choices: CapabilitySelections, supabaseUrl?: string, supabaseAnonKey?: string) => void;
  onSkip: () => void;
}

const CAPABILITIES: CapabilityChoice[] = [
  {
    id: "authentication",
    label: "User Authentication",
    description: "Login, sign up, user profiles & sessions",
    icon: <ShieldCheckIcon className="w-5 h-5" />,
    requiresSupabase: true,
    badge: "Supabase Auth",
  },
  {
    id: "database",
    label: "Database",
    description: "Store & query user data, content, or records",
    icon: <DatabaseIcon className="w-5 h-5" />,
    requiresSupabase: true,
    badge: "Supabase DB",
  },
  {
    id: "storage",
    label: "File Storage",
    description: "Upload & serve images, documents, and files",
    icon: <FolderUpIcon className="w-5 h-5" />,
    requiresSupabase: true,
    badge: "Supabase Storage",
  },
  {
    id: "payments",
    label: "Payment Processing",
    description: "Accept payments, subscriptions & checkout flows",
    icon: <CreditCardIcon className="w-5 h-5" />,
    requiresSupabase: false,
    badge: "Stripe",
  },
  {
    id: "aiFeatures",
    label: "AI Features",
    description: "Chatbot, content generation, image AI, or smart search",
    icon: <BrainCircuitIcon className="w-5 h-5" />,
    requiresSupabase: false,
    badge: "OpenAI",
  },
  {
    id: "frontendOnly",
    label: "Just frontend — no backend needed",
    description: "Static website, landing page, or portfolio",
    icon: <LayoutTemplateIcon className="w-5 h-5" />,
    requiresSupabase: false,
  },
];

export function CapabilityWizard({ projectId, open, onComplete, onSkip }: Props) {
  const trpc = useTRPC();
  const [step, setStep] = useState<"capabilities" | "supabase">("capabilities");
  const [selections, setSelections] = useState<CapabilitySelections>({
    authentication: false,
    database: false,
    storage: false,
    payments: false,
    aiFeatures: false,
    frontendOnly: false,
  });
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");

  const { mutate: saveChoices, isPending } = useMutation(
    trpc.projects.saveCapabilityChoices.mutationOptions({
      onSuccess: () => {
        toast.success("Backend setup saved!");
        onComplete(selections, supabaseUrl || undefined, supabaseAnonKey || undefined);
      },
      onError: () => {
        // Non-blocking — still proceed even if save fails
        onComplete(selections, supabaseUrl || undefined, supabaseAnonKey || undefined);
      },
    })
  );

  const needsSupabase = selections.authentication || selections.database || selections.storage;

  function toggleCapability(id: keyof CapabilitySelections) {
    if (id === "frontendOnly") {
      // Frontend-only deselects all others
      setSelections({
        authentication: false,
        database: false,
        storage: false,
        payments: false,
        aiFeatures: false,
        frontendOnly: !selections.frontendOnly,
      });
    } else {
      setSelections((prev) => ({
        ...prev,
        [id]: !prev[id],
        frontendOnly: false, // deselect frontend-only when picking a backend feature
      }));
    }
  }

  function handleContinue() {
    if (needsSupabase) {
      setStep("supabase");
    } else {
      handleFinish();
    }
  }

  function handleFinish() {
    saveChoices({
      projectId,
      choices: {
        authentication: selections.authentication,
        database: selections.database,
        storage: selections.storage,
        payments: selections.payments,
        aiFeatures: selections.aiFeatures,
        backendRequired: needsSupabase || selections.payments || selections.aiFeatures,
      },
      supabaseUrl: supabaseUrl || undefined,
      supabaseAnonKey: supabaseAnonKey || undefined,
    });
  }

  const hasAnySelection = Object.values(selections).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onSkip()}>
      <DialogContent className="max-w-lg bg-[#18181b] border border-white/[0.08] text-zinc-100 p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <ZapIcon className="w-4 h-4 text-violet-400" />
            </div>
            <Badge variant="secondary" className="text-[10px] bg-violet-600/10 text-violet-400 border-violet-500/20">
              Quick Setup
            </Badge>
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-semibold text-zinc-100">
              {step === "capabilities" ? "What does your app need?" : "Connect Supabase"}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              {step === "capabilities"
                ? "We'll set up all the infrastructure automatically for you."
                : "Your Supabase credentials to enable database, auth & storage."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Step 1: Capability Selection */}
        {step === "capabilities" && (
          <div className="px-6 py-4 space-y-2">
            {CAPABILITIES.map((cap) => {
              const isSelected = selections[cap.id];
              return (
                <button
                  key={cap.id}
                  onClick={() => toggleCapability(cap.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200",
                    isSelected
                      ? "bg-violet-600/10 border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.08)]"
                      : "bg-[#27272a] border-white/[0.06] hover:border-white/20 hover:bg-[#2d2d30]"
                  )}
                >
                  <div
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-violet-600 text-white"
                        : "bg-white/[0.05] text-zinc-400"
                    )}
                  >
                    {isSelected ? <CheckIcon className="w-4 h-4" /> : cap.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-200">{cap.label}</span>
                      {cap.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-500 font-mono">
                          {cap.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{cap.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Supabase Credentials */}
        {step === "supabase" && (
          <div className="px-6 py-4 space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
              <DatabaseIcon className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">
                You selected features that require Supabase. Add your credentials below, or{" "}
                <button
                  onClick={handleFinish}
                  className="underline underline-offset-2 hover:text-blue-200"
                >
                  skip for now
                </button>{" "}
                and add them later in project settings.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Supabase Project URL</Label>
                <Input
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                  className="bg-[#27272a] border-white/[0.08] text-zinc-200 placeholder:text-zinc-600 text-sm h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Anon (public) Key</Label>
                <Input
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="bg-[#27272a] border-white/[0.08] text-zinc-200 placeholder:text-zinc-600 text-sm h-9 font-mono"
                  type="password"
                />
              </div>
            </div>

            <a
              href="https://supabase.com/dashboard/project/_/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <ExternalLinkIcon className="w-3 h-3" />
              Find your credentials in Supabase Dashboard → Settings → API
            </a>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-white/[0.06]">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
          >
            Skip for now
          </Button>
          <div className="flex items-center gap-2">
            {step === "supabase" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("capabilities")}
                className="text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
              >
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={step === "capabilities" ? handleContinue : handleFinish}
              disabled={(!hasAnySelection && step === "capabilities") || isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5 transition-all"
            >
              {isPending ? "Saving..." : step === "capabilities" && needsSupabase ? "Connect Supabase" : "Start Building"}
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
