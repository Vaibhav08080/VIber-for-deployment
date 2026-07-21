import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { toast } from 'sonner';
import { Usage } from "./usage";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Hint } from "./hint";
import { SpeechRecognitionButton } from "@/components/speech-recognition-button";

import { useUser } from "@clerk/nextjs";

interface Props {
  projectId: string;
}

const FormSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Value is required" })
    .max(10000, { message: "Value is too long" }),
});

export const MessageForm = ({ projectId }: Props) => {
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useUser();
    const { data: usage } = useQuery({
      ...trpc.usage.status.queryOptions(),
      enabled: !!user,
    });

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            value: "",
        },
    });

    const CreateMessage = useMutation(trpc.messages.create.mutationOptions({
        onSuccess: () => {
            form.reset();
            queryClient.invalidateQueries(trpc.messages.getMany.queryOptions({ projectId }));
            queryClient.invalidateQueries(trpc.usage.status.queryOptions());
        },
        onError: (error) => {
            toast.error(error.message);
            if (error.data?.code === "TOO_MANY_REQUESTS") {
                queryClient.invalidateQueries(trpc.usage.status.queryOptions());
                router.push("/pricing");
            }
        },
    }));

    const EnhancePrompt = useMutation(trpc.projects.enhancePrompt.mutationOptions({
        onSuccess: ({ enhanced }) => {
            form.setValue("value", enhanced, { shouldValidate: true, shouldDirty: true });
            toast.success("Prompt enhanced! ✨");
        },
        onError: () => {
            toast.error("Enhancement failed. Try again.");
        },
    }));

    const onSubmit = async (values: z.infer<typeof FormSchema>) => {
        await CreateMessage.mutateAsync({
            value: values.value,
            projectId,
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

    const isPending = CreateMessage.isPending;
    const isEnhancing = EnhancePrompt.isPending;
    const isButtonDisabled = isPending || !form.formState.isValid;
    const [isFocused, setIsFocused] = useState(false);
    const showUsage = !!usage;

    return (
        <Form {...form}>
            {showUsage && <Usage points={usage.remainingPoints} msBeforeNext={usage.msBeforeNext} />}
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={cn(
                    "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
                    isFocused && "shadow-xs",
                    showUsage && "rounded-t-none"
                )}
            >
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
                            maxRows={8}
                            className="pt-4 resize-none border-none w-full outline-none bg-transparent"
                            placeholder="What Would you like to build?"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    form.handleSubmit(onSubmit)(e);
                                }
                            }}
                        />
                    )}
                />
                <div className="flex gap-x-2 items-end justify-between pt-2">
                    {/* Left: Enhance button + keyboard hint */}
                    <div className="flex items-center gap-x-2">
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
                        <Hint text="Enhance prompt with AI ✨" side="top">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isPending || isEnhancing}
                                onClick={handleEnhance}
                                className={cn(
                                    "gap-1.5 text-xs h-7 px-2 transition-all",
                                    isEnhancing && "text-purple-500 border-purple-400 dark:border-purple-600"
                                )}
                            >
                                {isEnhancing ? (
                                    <>
                                        <Loader2Icon className="size-3 animate-spin text-purple-500" />
                                        <span className="text-purple-500">Enhancing...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="size-3" />
                                        <span>Enhance</span>
                                    </>
                                )}
                            </Button>
                        </Hint>
                        <div className="text-[10px] text-muted-foreground font-mono">
                            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                                <span>⌘</span>Enter
                            </kbd>
                            &nbsp;to submit
                        </div>
                    </div>

                    {/* Right: Submit button */}
                    <Button
                        disabled={isButtonDisabled}
                        className={cn(
                            "size-8 rounded-full",
                            isButtonDisabled && "bg-muted-foreground border"
                        )}
                    >
                        {isPending ? (
                            <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                            <ArrowUpIcon className="size-4" />
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
