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
        content: `System Context:\n${JSON.stringify(context, null, 2)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const defaultArchitecture: ArchitecturePlan = {
    fileTree: [
      "app/page.tsx",
      "components/navbar.tsx",
      "components/hero.tsx",
      "components/features.tsx",
      "components/interactive-section.tsx",
      "components/testimonials.tsx",
      "components/pricing.tsx",
      "components/faq.tsx",
      "components/footer.tsx",
      "lib/types.ts",
      "lib/mock-data.ts",
    ],
    componentContracts: [
      { path: "app/page.tsx", isClient: true, description: "Main page" },
    ],
    stateManagement: "React useState / zustand",
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
