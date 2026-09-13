import OpenAI from "openai";
import { prisma } from "@/lib/db";

let openaiClient: OpenAI | null = null;
let geminiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Returns a Gemini-powered client using Google's official OpenAI-compatible endpoint.
 * Falls back to OpenAI if GOOGLE_API_KEY / GEMINI_API_KEY is not configured.
 */
export function getGeminiClient(): { client: OpenAI; model: string; isGemini: boolean } {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey && geminiKey.trim() !== "") {
    if (!geminiClient) {
      geminiClient = new OpenAI({
        apiKey: geminiKey.trim(),
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      });
    }
    return { client: geminiClient, model: "gemini-2.0-flash", isGemini: true };
  }
  // Fallback to OpenAI
  return { client: getOpenAIClient(), model: "gpt-4o-mini", isGemini: false };
}

let groqClient: OpenAI | null = null;

/**
 * Returns a Groq-powered client for ultra-fast inference (Llama 3.3 70B @ 500+ tokens/sec).
 * Falls back to Gemini or OpenAI if GROQ_API_KEY is not configured.
 */
export function getGroqClient(): { client: OpenAI; model: string; isGroq: boolean } {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey.trim() !== "") {
    if (!groqClient) {
      groqClient = new OpenAI({
        apiKey: groqKey.trim(),
        baseURL: "https://api.groq.com/openai/v1",
      });
    }
    return { client: groqClient, model: "llama-3.3-70b-versatile", isGroq: true };
  }
  return { client: getOpenAIClient(), model: "gpt-4o-mini", isGroq: false };
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
}

/**
 * Performs live web search using Tavily AI Search API.
 * Returns relevant web results or empty array if key is missing or search fails.
 */
export async function searchTavily(query: string, maxResults: number = 5): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return [];
  }
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey.trim(),
        query,
        search_depth: "basic",
        include_answer: true,
        max_results: maxResults,
      }),
    });
    if (!res.ok) {
      console.warn(`[Tavily] Search response not OK: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      title: r.title || "",
      url: r.url || "",
      content: r.content || "",
    }));
  } catch (err) {
    console.warn("[Tavily] Search error:", err);
    return [];
  }
}

/**
 * Robust JSON extraction helper that handles raw JSON, markdown blocks (```json ... ```),
 * trailing commas, and partial responses.
 */
export function extractAndParseJSON<T>(rawText: string, fallback: T): T {
  if (!rawText || typeof rawText !== "string") return fallback;
  
  let cleaned = rawText.trim();
  
  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    const firstLineEnd = cleaned.indexOf("\n");
    if (firstLineEnd !== -1) {
      cleaned = cleaned.substring(firstLineEnd + 1);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
  }

  // Find first '{' or '[' and last '}' or ']'
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = 0;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  let endIdx = cleaned.length;
  if (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) {
    endIdx = lastBrace + 1;
  } else if (lastBracket !== -1) {
    endIdx = lastBracket + 1;
  }

  const jsonSubstring = cleaned.substring(startIdx, endIdx);

  try {
    return JSON.parse(jsonSubstring) as T;
  } catch (err) {
    console.warn("Direct JSON.parse failed, attempting sanitization...", err);
    try {
      // Remove trailing commas before closing braces/brackets
      const sanitized = jsonSubstring.replace(/,\s*([\]}])/g, "$1");
      return JSON.parse(sanitized) as T;
    } catch (finalErr) {
      console.error("Failed to parse JSON:", finalErr, "Raw Text:", rawText);
      return fallback;
    }
  }
}

/**
 * Report granular step progress to Prisma database so UI updates seamlessly in real time.
 */
export async function reportProgress(
  projectId: string,
  stepName: string,
  status: "RUNNING" | "DONE" | "ERROR" = "RUNNING"
) {
  try {
    if (status === "RUNNING") {
      await prisma.progressStep.create({
        data: { projectId, step: stepName, status: "RUNNING" },
      });
    } else {
      await prisma.progressStep.updateMany({
        where: { projectId, step: stepName, status: "RUNNING" },
        data: { status },
      });
    }
  } catch (err) {
    console.warn(`Progress reporting warning (${stepName}):`, err);
  }
}
