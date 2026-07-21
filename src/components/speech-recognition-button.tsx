"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MicIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

async function isSpeechRecognitionSupported(): Promise<boolean> {
  if (!getSpeechRecognition()) return false;

  const nav = navigator as Navigator & {
    brave?: { isBrave: () => Promise<boolean> };
  };

  if (nav.brave?.isBrave) {
    try {
      if (await nav.brave.isBrave()) return false;
    } catch {
      // Fall through — treat as supported if detection fails
    }
  }

  return true;
}

interface SpeechRecognitionButtonProps {
  onTranscript: (transcript: string) => void;
  getCurrentValue: () => string;
  disabled?: boolean;
  className?: string;
}

export const SpeechRecognitionButton = ({
  onTranscript,
  getCurrentValue,
  disabled = false,
  className,
}: SpeechRecognitionButtonProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef("");
  const onTranscriptRef = useRef(onTranscript);
  const getCurrentValueRef = useRef(getCurrentValue);

  onTranscriptRef.current = onTranscript;
  getCurrentValueRef.current = getCurrentValue;

  useEffect(() => {
    let cancelled = false;

    isSpeechRecognitionSupported().then((supported) => {
      if (!cancelled) setIsSupported(supported);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognitionRef.current = null;
    setIsListening(false);

    try {
      recognition.stop();
    } catch {
      try {
        recognition.abort();
      } catch {
        // Already stopped
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      try {
        recognition?.abort();
      } catch {
        // Already stopped
      }
    };
  }, []);

  useEffect(() => {
    if (disabled && isListening) {
      stopListening();
    }
  }, [disabled, isListening, stopListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) return;

    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) {
      toast.error("Voice input is not supported in this browser");
      return;
    }

    baseTextRef.current = getCurrentValueRef.current();

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event) => {
      const sessionTranscript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      const base = baseTextRef.current.trim();
      const combined = base
        ? `${base} ${sessionTranscript.trim()}`
        : sessionTranscript.trim();

      onTranscriptRef.current(combined);
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        const messages: Record<string, string> = {
          "not-allowed": "Microphone access denied",
          "no-speech": "No speech detected. Try again.",
          network: "Voice input unavailable in this browser. Try Chrome or Safari.",
        };
        toast.error(messages[event.error] ?? "Voice input failed");
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      toast.error("Could not start voice input. Try again.");
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={toggleListening}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            aria-pressed={isListening}
            className={cn(
              "gap-1.5 text-xs h-7 px-2 transition-all",
              isListening &&
                "text-red-500 border-red-400 dark:border-red-600 animate-pulse",
              className
            )}
          >
            <MicIcon className="size-3" />
            <span className="sr-only">
              {isListening ? "Stop" : "Voice input"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{isListening ? "Stop listening" : "Voice input"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
