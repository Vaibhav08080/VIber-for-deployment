import { WebsiteState, DesignSystem } from "../state";
import { DESIGN_AGENT_SYSTEM_PROMPT } from "../prompts/system-prompts";
import { getOpenAIClient, extractAndParseJSON, reportProgress } from "../utils";

export async function designAgentNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:Design] ⚡ Starting...`);
  console.log(`[AGENT:Design] Product: "${state.productSpec?.title}" (${state.productSpec?.productType})`);

  await reportProgress(state.projectId, "Designing interface & visual system...", "RUNNING");

  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    messages: [
      { role: "system", content: DESIGN_AGENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Product: "${state.productSpec?.title}" (${state.productSpec?.productType})\nUser Prompt: "${state.prompt}"\nKey Components: ${JSON.stringify(state.productSpec?.keyComponents || [])}\n\nDesign a UNIQUE, distinct visual theme, background, and color palette matching this domain. NEVER repeat the same purple/slate palette.`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const defaultDesign: DesignSystem = {
    theme: "dark",
    style: "Modern Glassmorphism & Cyber Clean",
    colors: {
      primary: "indigo-500",
      secondary: "purple-500",
      background: "bg-slate-950",
      card: "bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl",
      accent: "amber-400",
      border: "border-white/10",
      text: "text-slate-100",
    },
    typography: {
      fontFamily: "Inter, sans-serif",
      headingScale: "tracking-tight font-extrabold",
    },
    tokens: {
      glassCard: "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-xl rounded-2xl",
      primaryButton: "px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg transition-all duration-300 cursor-pointer active:scale-95",
    },
  };

  const designSystem = extractAndParseJSON<DesignSystem>(raw, defaultDesign);

  console.log(`[AGENT:Design] ✅ Design System:`);
  console.log(`  ↳ theme: ${designSystem.theme}`);
  console.log(`  ↳ style: ${designSystem.style}`);
  console.log(`  ↳ primary color: ${designSystem.colors?.primary}`);
  console.log(`  ↳ font: ${designSystem.typography?.fontFamily}`);
  console.log(`  ↳ tokens: ${Object.keys(designSystem.tokens || {}).join(", ")}`);

  await reportProgress(state.projectId, "Designing interface & visual system...", "DONE");
  console.log(`[AGENT:Design] 🏁 Done\n`);

  return { designSystem };
}
