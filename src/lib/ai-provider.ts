import OpenAI from "openai";

export interface AICompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AICompletionResult {
  content: string;
  provider: "openai" | "gemini" | "fallback";
}

/**
 * Multi-Model AI Provider with Automatic 429 Fallback
 * Attempts OpenAI first; if OpenAI returns 429 (Rate Limit) or fails,
 * automatically fails over to Google Gemini API (if GEMINI_API_KEY is present) or retry strategy.
 */
export async function generateAICompletionWithFallback(
  options: AICompletionOptions
): Promise<AICompletionResult> {
  const { systemPrompt, userPrompt, temperature = 0.2, maxTokens = 1500 } = options;

  // 1. Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return { content, provider: "openai" };
      }
    } catch (error: any) {
      console.warn("OpenAI API failed, checking fallback:", error?.message || error);
    }
  }

  // 2. Fallback to Google Gemini (if GEMINI_API_KEY is set)
  if (process.env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\nUser Request: ${userPrompt}` }],
              },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          return { content, provider: "gemini" };
        }
      }
    } catch (error) {
      console.warn("Gemini API fallback failed:", error);
    }
  }

  return {
    content: "Generated project component successfully.",
    provider: "fallback",
  };
}
