import { z } from "zod";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon, SparklesIcon, PaperclipIcon, XIcon } from "lucide-react";
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
import { compressImage } from "@/lib/compress-image";

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
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleImageFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file.");
            return;
        }
        try {
            const compressed = await compressImage(file);
            setImageDataUrl(compressed);
            toast.success("Image attached! 📎");
        } catch {
            toast.error("Failed to process image.");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageFile(file);
        }
        e.target.value = "";
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) {
                    e.preventDefault();
                    handleImageFile(file);
                    break;
                }
            }
        }
    };

    const CreateMessage = useMutation(trpc.messages.create.mutationOptions({
        onSuccess: () => {
            form.reset();
            setImageDataUrl(null);
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
            imageUrl: imageDataUrl || undefined,
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
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={cn(
                    "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all flex flex-col gap-2",
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
                            onPaste={handlePaste}
                            minRows={2}
                            maxRows={8}
                            className="pt-4 resize-none border-none w-full outline-none bg-transparent"
                            placeholder="What would you like to build? Ask or attach a screenshot..."
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    form.handleSubmit(onSubmit)(e);
                                }
                            }}
                        />
                    )}
                />

                {/* Image Preview */}
                {imageDataUrl && (
                    <div className="relative inline-block my-1 self-start group">
                        <img
                            src={imageDataUrl}
                            alt="Attached preview"
                            className="h-16 max-w-xs object-cover rounded-lg border border-border shadow-sm transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setImageDataUrl(null)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-transform active:scale-95"
                            title="Remove attachment"
                        >
                            <XIcon className="size-3" />
                        </button>
                    </div>
                )}

                <div className="flex gap-x-2 items-end justify-between pt-2">
                    {/* Left: Paperclip + Voice + Enhance button + keyboard hint */}
                    <div className="flex items-center gap-x-2">
                        <Hint text="Attach image or screenshot 📎" side="top">
                            <Button
                                type="button"
                                variant={imageDataUrl ? "default" : "outline"}
                                size="sm"
                                disabled={isPending || isEnhancing}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "gap-1.5 text-xs h-7 px-2 transition-all",
                                    imageDataUrl && "bg-[#FF6A3D] text-white hover:bg-[#ff8a6d]"
                                )}
                            >
                                <PaperclipIcon className="size-3.5" />
                                <span className="hidden sm:inline">{imageDataUrl ? "Attached" : "Attach"}</span>
                            </Button>
                        </Hint>

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
                        <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">
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
