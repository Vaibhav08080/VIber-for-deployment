import { WebsiteState, CapabilityManifest } from "../state";
import { CAPABILITY_PLANNER_SYSTEM_PROMPT } from "../prompts/system-prompts";
import { getOpenAIClient, extractAndParseJSON } from "../utils";

export async function capabilityPlannerNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:CapabilityPlanner] ⚡ Starting...`);
  console.log(`[AGENT:CapabilityPlanner] ProductSpec: ${state.productSpec?.title}`);
  console.log(`[AGENT:CapabilityPlanner] Supabase connected: ${!!(state.supabaseUrl && state.supabaseAnonKey)}`);

  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    messages: [
      { role: "system", content: CAPABILITY_PLANNER_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Product Spec:\n${JSON.stringify(state.productSpec, null, 2)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const defaultCapabilities: CapabilityManifest = {
    frontend: true,
    backend: !!(state.supabaseUrl && state.supabaseAnonKey),
    database: !!(state.supabaseUrl && state.supabaseAnonKey),
    authentication: false,
    payments: false,
    storage: false,
    charts: true,
    aiIntegration: false,
    seo: true,
  };

  const capabilities = extractAndParseJSON<CapabilityManifest>(raw, defaultCapabilities);

  if (state.supabaseUrl && state.supabaseAnonKey) {
    capabilities.database = true;
    capabilities.backend = true;
  }

  console.log(`[AGENT:CapabilityPlanner] ✅ Capabilities activated:`);
  Object.entries(capabilities).forEach(([key, val]) => {
    console.log(`  ↳ ${key}: ${val ? "✅" : "❌"}`);
  });
  console.log(`[AGENT:CapabilityPlanner] 🏁 Done\n`);

  return { capabilities };
}
