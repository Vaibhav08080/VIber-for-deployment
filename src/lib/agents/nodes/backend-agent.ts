import { WebsiteState } from "../state";
import { getOpenAIClient, extractAndParseJSON, reportProgress } from "../utils";
import { getSandbox } from "@/inngest/utils";

/**
 * Backend Agent Node
 *
 * Runs IN PARALLEL with the frontend implementation agent (via LangGraph fan-out).
 * Generates all backend infrastructure:
 *  - Supabase client setup (browser + server)
 *  - Next.js API Route Handlers
 *  - Server Actions for form submissions
 *  - SQL schema migration (executed in sandbox if Supabase connected)
 *
 * Only activates when capabilities.backend = true.
 * If backend is not needed, returns early with empty result.
 */
export async function backendAgentNode(
  state: WebsiteState
): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:Backend] ⚡ Starting backend generation...`);

  // Skip if no backend is needed
  const capabilities = state.capabilities;
  if (!capabilities?.backend && !capabilities?.database && !capabilities?.authentication) {
    console.log(`[AGENT:Backend] ℹ️ No backend capabilities required — skipping`);
    return {};
  }

  console.log(`[AGENT:Backend] Capabilities: backend=${capabilities?.backend}, db=${capabilities?.database}, auth=${capabilities?.authentication}, payments=${capabilities?.payments}`);
  console.log(`[AGENT:Backend] Supabase connected: ${!!(state.supabaseUrl && state.supabaseAnonKey)}`);

  await reportProgress(state.projectId, "Setting up backend & database...", "RUNNING");

  const client = getOpenAIClient();

  const backendContext = {
    productSpec: state.productSpec,
    capabilities: state.capabilities,
    capabilityChoices: state.capabilityChoices,
    architecture: state.architecture,
    supabaseConnected: !!(state.supabaseUrl && state.supabaseAnonKey),
    supabaseUrl: state.supabaseUrl || "SUPABASE_URL_PLACEHOLDER",
  };

  const systemPrompt = `You are the Senior Backend Engineer at Vibel.
Generate complete, production-ready Next.js 15 backend code for the application.

GENERATION RULES:
1. Always generate lib/supabase/client.ts (browser Supabase client)
2. Always generate lib/supabase/server.ts (server-side Supabase client with cookie handling)
3. Generate app/api/[resource]/route.ts Route Handlers for each major resource
4. Generate app/actions/[resource].ts Server Actions for form submissions
5. If authentication is needed: generate middleware.ts for route protection
6. If schemaSql exists in architecture: include it in a lib/supabase/schema.sql file

SUPABASE CLIENT TEMPLATES:
- client.ts must use: createBrowserClient from '@supabase/ssr'
- server.ts must use: createServerClient from '@supabase/ssr' with Next.js cookies()

Do NOT generate any frontend React components — those are handled by a separate agent.

Output MUST be valid JSON:
{
  "backendFiles": {
    "lib/supabase/client.ts": "// full code...",
    "lib/supabase/server.ts": "// full code...",
    "lib/supabase/types.ts": "// full code...",
    "app/api/[resource]/route.ts": "// full code...",
    "app/actions/[resource].ts": "// full code..."
  },
  "schemaSql": "-- SQL DDL statements for Supabase...",
  "packageDependencies": ["@supabase/supabase-js", "@supabase/ssr"]
}
Return ONLY raw JSON. No markdown fences.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    max_tokens: 6000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Original Request: "${state.prompt}"\n\nBackend Context:\n${JSON.stringify(backendContext, null, 2)}\n\nArchitecture schemaSql: ${state.architecture?.schemaSql || "None"}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const parsed = extractAndParseJSON<{
    backendFiles: Record<string, string>;
    schemaSql: string;
    packageDependencies: string[];
  }>(raw, { backendFiles: {}, schemaSql: "", packageDependencies: [] });

  const backendFiles = parsed.backendFiles || {};
  const schemaSql = parsed.schemaSql || state.architecture?.schemaSql || "";
  const packageDependencies = parsed.packageDependencies || [];

  console.log(`[AGENT:Backend] ✅ Backend files generated: ${Object.keys(backendFiles).length}`);
  Object.keys(backendFiles).forEach((path) => {
    const lines = (backendFiles[path] || "").split("\n").length;
    console.log(`  ↳ ${path} (${lines} lines)`);
  });

  // Write backend files to E2B sandbox
  if (state.sandboxId && Object.keys(backendFiles).length > 0) {
    try {
      const sandbox = await getSandbox(state.sandboxId);

      // Write all backend files
      await Promise.all(
        Object.entries(backendFiles).map(async ([filePath, content]) => {
          await sandbox.files.write(filePath, content);
          console.log(`[AGENT:Backend] Wrote: ${filePath}`);
        })
      );

      // Install Supabase packages if needed
      if (packageDependencies.length > 0) {
        console.log(`[AGENT:Backend] Installing packages: ${packageDependencies.join(", ")}`);
        const installResult = await sandbox.commands.run(
          `cd /home/user && npm install ${packageDependencies.join(" ")} --legacy-peer-deps 2>&1 | tail -5`,
          { timeoutMs: 60000 }
        );
        console.log(`[AGENT:Backend] Package install output: ${installResult.stdout?.substring(0, 200)}`);
      }

      // If Supabase is connected and we have SQL schema, write migration file
      if (schemaSql && state.supabaseUrl && state.supabaseAnonKey) {
        await sandbox.files.write("lib/supabase/schema.sql", schemaSql);
        console.log(`[AGENT:Backend] ✅ Schema SQL written to lib/supabase/schema.sql`);
      }

      console.log(`[AGENT:Backend] ✅ All backend files written to sandbox`);
    } catch (sandboxErr) {
      console.error(`[AGENT:Backend] ❌ Sandbox write error:`, sandboxErr);
    }
  }

  await reportProgress(state.projectId, "Setting up backend & database...", "DONE");
  console.log(`[AGENT:Backend] 🏁 Done\n`);

  // Merge backend files into the shared state files map
  return {
    files: backendFiles,
  };
}
