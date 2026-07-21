"use client";

import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { Loader2Icon, SparklesIcon, ArrowRightIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Form, FormField } from "@/components/ui/form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PROJECT_TEMPLATES } from "../../constants";
import { useClerk } from "@clerk/nextjs";
import { SpeechRecognitionButton } from "@/components/speech-recognition-button";

const FormSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Value is required" })
    .max(10000, { message: "Value is too long" }),
});

export const ProjectForm = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const clerk = useClerk();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { value: "" },
  });

  const CreateProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        form.reset();
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        router.push(`/projects/${data.id}`);
        queryClient.invalidateQueries(trpc.usage.status.queryOptions());
      },
      onError: (error) => {
        toast.error(error.message);
        if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
        if (error.data?.code === "TOO_MANY_REQUESTS") router.push("/pricing");
      },
    })
  );

  const EnhancePrompt = useMutation(
    trpc.projects.enhancePrompt.mutationOptions({
      onSuccess: ({ enhanced }) => {
        form.setValue("value", enhanced, { shouldValidate: true, shouldDirty: true });
        toast.success("Prompt enhanced! ✨");
      },
      onError: () => {
        toast.error("Enhancement failed. Try again.");
      },
    })
  );

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    await CreateProject.mutateAsync({ value: values.value });
  };

  const onSelect = (content: string) => {
    form.setValue("value", content, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
  };

  const handleEnhance = () => {
    const currentValue = form.getValues("value").trim();
    if (!currentValue) {
      toast.error("Write something first to enhance!");
      return;
    }
    EnhancePrompt.mutate({ prompt: currentValue });
  };

  const isPending = CreateProject.isPending;
  const isEnhancing = EnhancePrompt.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Form {...form}>
      <section className="space-y-6 max-w-4xl mx-auto w-full">
        {/* Glassmorphic Prompt Input Container */}
        <div
          className={cn(
            "glass-panel p-2 md:p-3 rounded-2xl border border-black/10 dark:border-[#444748]/30 shadow-xl transition-all duration-300 bg-white dark:bg-[#121414]/80",
            isFocused && "border-[#FF6A3D]/60 ring-2 ring-[#FF6A3D]/20 shadow-2xl"
          )}
        >
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full px-4 py-2 flex items-start gap-3">
              <span className="material-symbols-outlined text-neutral-400 dark:text-[#8e9192] mt-3">auto_awesome</span>
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <TextareaAutosize
                    {...field}
                    disabled={isPending || isEnhancing}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    minRows={2}
                    maxRows={6}
                    className="pt-2 resize-none border-none w-full outline-none bg-transparent text-[#090909] dark:text-[#e3e2e2] placeholder:text-neutral-400 dark:placeholder:text-[#8e9192] font-['Geist'] text-base md:text-lg focus:ring-0"
                    placeholder="What should we build today? Describe your website or app..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)(e);
                      }
                    }}
                  />
                )}
              />
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3 p-2 w-full md:w-auto border-t md:border-t-0 md:border-l border-black/10 dark:border-[#444748]/30">
              <div className="flex items-center gap-1">
                {/* Voice Input */}
                <SpeechRecognitionButton
                  disabled={isPending || isEnhancing}
                  getCurrentValue={() => form.getValues("value")}
                  onTranscript={(transcript) =>
                    form.setValue("value", transcript, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />

                {/* Enhance Button */}
                <button
                  type="button"
                  disabled={isPending || isEnhancing}
                  onClick={handleEnhance}
                  title="Enhance prompt with AI"
                  className={cn(
                    "p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#292a2a] transition-colors text-neutral-600 dark:text-[#8e9192] hover:text-[#090909] dark:hover:text-[#e3e2e2] flex items-center gap-1.5 text-xs font-mono cursor-pointer",
                    isEnhancing && "text-purple-500 animate-pulse"
                  )}
                >
                  {isEnhancing ? (
                    <Loader2Icon className="size-4 animate-spin text-purple-500" />
                  ) : (
                    <SparklesIcon className="size-4 text-[#FF6A3D]" />
                  )}
                  <span className="hidden sm:inline">Enhance</span>
                </button>
              </div>

              {/* Submit GENERATE Button */}
              <button
                type="submit"
                disabled={isButtonDisabled}
                className={cn(
                  "bg-[#FF6A3D] text-white dark:text-[#3b0a00] px-7 py-3 rounded-xl font-['Geist'] text-xs uppercase tracking-widest font-extrabold hover:bg-[#ff8a6d] active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,106,61,0.3)] cursor-pointer",
                  isButtonDisabled && "opacity-50 cursor-not-allowed hover:bg-[#FF6A3D] active:scale-100 shadow-none"
                )}
              >
                {isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    <span>BUILDING...</span>
                  </>
                ) : (
                  <>
                    <span>GENERATE</span>
                    <ArrowRightIcon className="size-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Shortcut hint */}
          <div className="px-4 pb-2 text-[11px] text-neutral-400 dark:text-[#8e9192] font-mono flex items-center justify-end gap-1">
            <kbd className="inline-flex h-4 items-center gap-0.5 rounded border border-neutral-200 dark:border-[#444748]/50 bg-neutral-100 dark:bg-[#1a1c1c] px-1 text-[10px] text-neutral-600 dark:text-[#c4c7c7]">
              <span>⌘</span>Enter
            </kbd>
            <span>to submit</span>
          </div>
        </div>

        {/* Template Pills */}
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto pt-2">
          {PROJECT_TEMPLATES.map((template) => (
            <button
              key={template.title}
              type="button"
              className="bg-white dark:bg-[#121414]/80 border border-neutral-200/90 dark:border-[#444748]/40 hover:border-[#FF6A3D]/60 text-neutral-800 dark:text-[#c4c7c7] hover:text-[#090909] dark:hover:text-[#e3e2e2] px-4 py-2 rounded-full text-xs font-['Geist'] transition-all backdrop-blur-md flex items-center gap-1.5 shadow-xs hover:shadow-sm cursor-pointer"
              onClick={() => onSelect(template.prompt)}
            >
              <span>{template.emoji}</span>
              <span>{template.title}</span>
            </button>
          ))}
        </div>
      </section>
    </Form>
  );
};
