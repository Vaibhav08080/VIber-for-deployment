import { WebsiteState, ResourceManifest } from "../state";
import { RESEARCH_AGENT_SYSTEM_PROMPT } from "../prompts/system-prompts";
import { getOpenAIClient, extractAndParseJSON, reportProgress, searchTavily } from "../utils";
import { getFallbackImageForContext, fetchLiveUnsplashImages } from "@/lib/image-assets";

export async function researchAgentNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:Research] ⚡ Starting...`);
  console.log(`[AGENT:Research] Product: "${state.productSpec?.title}"`);

  await reportProgress(state.projectId, "Gathering verified stock assets & docs...", "RUNNING");

  // 1. Live Tavily web search for domain & UI design context if enabled
  let searchContext = "";
  try {
    const searchQuery = `${state.productSpec?.title || state.prompt} modern web design ui patterns best features`;
    console.log(`[AGENT:Research] 🌐 Searching Tavily for: "${searchQuery}"...`);
    const tavilyResults = await searchTavily(searchQuery, 3);
    if (tavilyResults.length > 0) {
      console.log(`[AGENT:Research] ✅ Retrieved ${tavilyResults.length} live web results from Tavily`);
      searchContext = `\n\nLive Web Research:\n` + tavilyResults.map((r, i) => `${i + 1}. ${r.title}\n${r.content.substring(0, 300)}...`).join("\n\n");
    }
  } catch (tavilyErr) {
    console.warn("[AGENT:Research] Tavily search skipped:", tavilyErr);
  }

  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: RESEARCH_AGENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Product Spec:\n${JSON.stringify(state.productSpec, null, 2)}\n\nCapabilities:\n${JSON.stringify(state.capabilities, null, 2)}${searchContext}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";

  // 2. Fetch live Unsplash photos matching the product domain
  const imageSearchTerm = state.productSpec?.title || state.prompt;
  const liveImages = await fetchLiveUnsplashImages(imageSearchTerm, 4);

  const defaultResources: ResourceManifest = {
    images: [
      { key: "hero", url: liveImages[0]?.url || getFallbackImageForContext(imageSearchTerm, 0), alt: liveImages[0]?.alt || `${state.productSpec?.title || "Product"} Hero` },
      { key: "feature1", url: liveImages[1]?.url || getFallbackImageForContext(imageSearchTerm, 1), alt: liveImages[1]?.alt || "Feature visual 1" },
      { key: "feature2", url: liveImages[2]?.url || getFallbackImageForContext(imageSearchTerm, 2), alt: liveImages[2]?.alt || "Feature visual 2" },
      { key: "feature3", url: liveImages[3]?.url || getFallbackImageForContext(imageSearchTerm, 3), alt: liveImages[3]?.alt || "Feature visual 3" },
    ],
    icons: ["Sparkles", "Zap", "Layers", "Compass", "ShieldCheck", "ArrowRight", "Star", "Check"],
    docNotes: ["Use Lucide-react icons", "Use Recharts for metrics if needed"],
    mockData: {},
  };

  const parsed = extractAndParseJSON<ResourceManifest>(raw, defaultResources);
  // Ensure images are populated with high quality verified URLs
  const resources: ResourceManifest = {
    ...parsed,
    images: (parsed.images && parsed.images.length > 0) ? parsed.images : defaultResources.images,
  };

  console.log(`[AGENT:Research] ✅ Resources found:`);
  console.log(`  ↳ images: ${resources.images?.length || 0}`);
  resources.images?.forEach((img) => console.log(`     • ${img.key}: ${img.url.substring(0, 60)}...`));
  console.log(`  ↳ icons: ${resources.icons?.join(", ")}`);
  console.log(`  ↳ docNotes: ${resources.docNotes?.length || 0}`);

  await reportProgress(state.projectId, "Gathering verified stock assets & docs...", "DONE");
  console.log(`[AGENT:Research] 🏁 Done\n`);

  return { resources };
}
