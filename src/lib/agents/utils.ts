import OpenAI from "openai";
import { prisma } from "@/lib/db";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
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
