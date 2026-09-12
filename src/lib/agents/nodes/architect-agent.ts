import { WebsiteState, ArchitecturePlan } from "../state";
import { ARCHITECT_AGENT_SYSTEM_PROMPT } from "../prompts/system-prompts";
import { getOpenAIClient, extractAndParseJSON, reportProgress } from "../utils";

export async function architectAgentNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:Architect] ⚡ Starting...`);
  console.log(`[AGENT:Architect] Product: "${state.productSpec?.title}"`);
  console.log(`[AGENT:Architect] Capabilities: ${JSON.stringify(state.capabilities)}`);

  await reportProgress(state.projectId, "Architecting full-stack structure & contracts...", "RUNNING");

  const client = getOpenAIClient();

  const context = {
    productSpec: state.productSpec,
    capabilities: state.capabilities,
    designSystem: state.designSystem,
    resources: state.resources,
    content: state.content,
    supabaseConnected: !!(state.supabaseUrl && state.supabaseAnonKey),
  };

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages: [
      { role: "system", content: ARCHITECT_AGENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Product: "${state.productSpec?.title}"\nKey Features to Implement as Components: ${JSON.stringify(state.productSpec?.keyComponents || [])}\n\nSystem Context:\n${JSON.stringify(context, null, 2)}\n\nIMPORTANT: Do NOT output generic "features.tsx" or "interactive-section.tsx". Name every component after its exact feature from Key Features above!`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";

  // Build dynamic default fileTree from keyComponents if available
  const dynamicFeatureFiles = (state.productSpec?.keyComponents || [])
    .filter((k) => !["navbar", "hero", "footer"].includes(k.toLowerCase()))
    .map((k) => `components/${k.toLowerCase().replace(/[^a-z0-9]/g, "-")}.tsx`);

  const defaultArchitecture: ArchitecturePlan = {
    fileTree: [
      "app/page.tsx",
      "components/navbar.tsx",
      "components/hero.tsx",
      ...(dynamicFeatureFiles.length > 0 ? dynamicFeatureFiles : ["components/main-feature.tsx"]),
      "components/footer.tsx",
      "lib/mock-data.ts",
    ],
    componentContracts: [
      { path: "app/page.tsx", isClient: true, description: "Main page mounting all components" },
    ],
    stateManagement: "React useState",
    entryPoint: "app/page.tsx",
  };

  const architecture = extractAndParseJSON<ArchitecturePlan>(raw, defaultArchitecture);

  console.log(`[AGENT:Architect] ✅ Architecture plan:`);
  console.log(`  ↳ fileTree (${architecture.fileTree?.length} files):`);
  architecture.fileTree?.forEach((f) => console.log(`     • ${f}`));
  console.log(`  ↳ stateManagement: ${architecture.stateManagement}`);
  console.log(`  ↳ entryPoint: ${architecture.entryPoint}`);
  if (architecture.schemaSql) {
    console.log(`  ↳ schemaSql: ${architecture.schemaSql.substring(0, 100)}...`);
  }

  await reportProgress(state.projectId, "Architecting full-stack structure & contracts...", "DONE");
  console.log(`[AGENT:Architect] 🏁 Done\n`);

  return { architecture };
}
