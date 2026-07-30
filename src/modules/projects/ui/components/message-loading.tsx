"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { CheckCircle2Icon, Loader2Icon, CircleIcon, AlertCircleIcon } from "lucide-react";

// Ordered step definitions with icons for upcoming steps
const STEP_ORDER = [
  "Setting up sandbox...",
  "Loading conversation history...",
  "AI is writing your code...",
  "Generating app title...",
  "Building your app preview...",
  "Saving results...",
];

interface ProgressStepData {
  id: string;
  step: string;
  status: "RUNNING" | "DONE" | "ERROR";
  createdAt: Date;
}

const StepIcon = ({ status }: { status: "RUNNING" | "DONE" | "ERROR" | "UPCOMING" }) => {
  switch (status) {
    case "DONE":
      return <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />;
    case "RUNNING":
      return <Loader2Icon className="size-4 text-[var(--primary)] shrink-0 animate-progress-spin" />;
    case "ERROR":
      return <AlertCircleIcon className="size-4 text-red-500 shrink-0" />;
    case "UPCOMING":
      return <CircleIcon className="size-3.5 text-muted-foreground/30 shrink-0" />;
  }
};

const ElapsedTimer = ({ startTime }: { startTime: number }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return (
    <span className="text-xs font-mono text-muted-foreground tabular-nums">
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
};

interface MessageLoadingProps {
  projectId: string;
}

export const MessageLoading = ({ projectId }: MessageLoadingProps) => {
  const trpc = useTRPC();
  const [startTime] = useState(Date.now);

  const { data: steps } = useQuery({
    ...trpc.progress.getSteps.queryOptions({ projectId }),
    refetchInterval: 2000,
  });

  const progressSteps: ProgressStepData[] = steps ?? [];

  // Build the display: merge DB steps with upcoming steps
  const completedStepNames = new Set(progressSteps.map((s) => s.step));
  const runningStep = progressSteps.find((s) => s.status === "RUNNING");

  // Calculate progress percentage
  const doneCount = progressSteps.filter((s) => s.status === "DONE").length;
  const totalSteps = STEP_ORDER.length;
  const progressPercent = Math.min(
    Math.round(((doneCount + (runningStep ? 0.5 : 0)) / totalSteps) * 100),
    100
  );

  // If no DB steps yet, show a shimmer fallback
  if (progressSteps.length === 0) {
    return (
      <div className="flex flex-col group px-2 pb-4">
        <div className="flex items-center gap-2 pl-2 mb-2">
          <Image src="/logo.svg" alt="SparkSite" width={18} height={18} className="shrink-0" />
          <span className="text-sm font-medium">SparkSite</span>
        </div>
        <div className="pl-8.5 flex flex-col gap-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base text-muted-foreground animate-pulse">
              Preparing your build...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col group px-2 pb-4 animate-progress-slide-in">
      {/* Header */}
      <div className="flex items-center gap-2 pl-2 mb-3">
        <Image src="/logo.svg" alt="SparkSite" width={18} height={18} className="shrink-0" />
        <span className="text-sm font-semibold animate-progress-pulse">
          SparkSite is building...
        </span>
        <ElapsedTimer startTime={startTime} />
      </div>

      {/* Progress Steps Card */}
      <div className="ml-8 rounded-xl border border-border/60 bg-card/80 dark:bg-zinc-900/60 backdrop-blur-sm p-4 shadow-sm">
        <div className="flex flex-col gap-2.5">
          {STEP_ORDER.map((stepName, index) => {
            const dbStep = progressSteps.find((s) => s.step === stepName);
            let status: "DONE" | "RUNNING" | "ERROR" | "UPCOMING";

            if (dbStep) {
              status = dbStep.status as "DONE" | "RUNNING" | "ERROR";
            } else if (completedStepNames.size > 0) {
              // Show as upcoming if we have some steps but not this one
              status = "UPCOMING";
            } else {
              status = "UPCOMING";
            }

            return (
              <div
                key={stepName}
                className={`flex items-center gap-2.5 text-sm transition-all duration-300 ${
                  status === "DONE"
                    ? "text-muted-foreground"
                    : status === "RUNNING"
                    ? "text-foreground font-medium"
                    : status === "ERROR"
                    ? "text-red-500"
                    : "text-muted-foreground/40"
                } ${status !== "UPCOMING" ? "animate-progress-slide-in" : ""}`}
                style={{
                  animationDelay: status !== "UPCOMING" ? `${index * 50}ms` : undefined,
                }}
              >
                <StepIcon status={status} />
                <span className={status === "RUNNING" ? "animate-progress-pulse" : ""}>
                  {stepName}
                </span>
                {status === "DONE" && (
                  <span className="text-[10px] text-emerald-500/70 font-mono ml-auto">done</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out animate-progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums min-w-[32px] text-right">
            {progressPercent}%
          </span>
        </div>
      </div>
    </div>
  );
};