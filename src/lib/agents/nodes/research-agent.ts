import { WebsiteState, ResourceManifest } from "../state";
import { RESEARCH_AGENT_SYSTEM_PROMPT } from "../prompts/system-prompts";
import { getOpenAIClient, extractAndParseJSON, reportProgress } from "../utils";

export async function researchAgentNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:Research] ⚡ Starting...`);
  console.log(`[AGENT:Research] Product: "${state.productSpec?.title}"`);

  await reportProgress(state.projectId, "Gathering verified stock assets & docs...", "RUNNING");

  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: RESEARCH_AGENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Product Spec:\n${JSON.stringify(state.productSpec, null, 2)}\n\nCapabilities:\n${JSON.stringify(state.capabilities, null, 2)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const defaultResources: ResourceManifest = {
    images: [
      { key: "hero", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80", alt: "Abstract dynamic visual" },
    ],
    icons: ["Sparkles", "Zap", "Layers", "BarChart3", "ShieldCheck", "ArrowRight", "Star", "Check"],
    docNotes: ["Use Lucide-react icons", "Use Recharts for metrics"],
    mockData: {},
  };

  const resources = extractAndParseJSON<ResourceManifest>(raw, defaultResources);

  console.log(`[AGENT:Research] ✅ Resources found:`);
  console.log(`  ↳ images: ${resources.images?.length || 0}`);
  resources.images?.forEach((img) => console.log(`     • ${img.key}: ${img.url.substring(0, 60)}...`));
  console.log(`  ↳ icons: ${resources.icons?.join(", ")}`);
  console.log(`  ↳ docNotes: ${resources.docNotes?.length || 0}`);

  await reportProgress(state.projectId, "Gathering verified stock assets & docs...", "DONE");
  console.log(`[AGENT:Research] 🏁 Done\n`);

  return { resources };
}
