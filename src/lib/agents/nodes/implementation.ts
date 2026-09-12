import { WebsiteState } from "../state";
import { getOpenAIClient, extractAndParseJSON, reportProgress } from "../utils";
import { getSandbox, sanitizeClientComponents, autoInstallMissingPackages, ensureNextjsServerRunning } from "@/inngest/utils";
import { SHADCN_UI_FILES } from "@/lib/shadcn-suite";

export async function implementationAgentNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:Implementation] ⚡ Starting code generation...`);
  console.log(`[AGENT:Implementation] Product: "${state.productSpec?.title}" (${state.productSpec?.productType})`);
  console.log(`[AGENT:Implementation] Files already present: ${Object.keys(state.files || {}).length}`);
  console.log(`[AGENT:Implementation] Architecture plan file count: ${state.architecture?.fileTree?.length || 0}`);

  await reportProgress(state.projectId, "Writing code & assembling application...", "RUNNING");

  const client = getOpenAIClient();

  // Build a context-specific prompt payload with all data from previous agents
  const promptPayload = {
    productSpec: state.productSpec,
    capabilities: state.capabilities,
    designSystem: state.designSystem,
    resources: state.resources,
    content: state.content,          // From Content Agent: headlines, FAQs, testimonials
    architecture: state.architecture, // From Architect Agent: file tree, component contracts
    existingFiles: Object.keys(state.files || {}),
    supabaseConnected: !!(state.supabaseUrl && state.supabaseAnonKey),
  };

  const systemInstruction = `
You are the Senior Full-Stack Implementation Engineer at Vibel.
You are generating a complete, highly interactive, production-ready Next.js 15 web application.

CRITICAL ARCHITECTURE & INTEGRATION RULES:
1. Entry Point: 'app/page.tsx' MUST be the main page.
2. YOU MUST GENERATE ALL FILES LISTED IN: ${JSON.stringify(state.architecture?.fileTree || [])}
3. 'app/page.tsx' MUST import and render EVERY single component in architecture.fileTree.
   - DO NOT skip any component!
   - DO NOT render empty divs or placeholder links!
4. Client Directives: MUST put "use client"; on the VERY FIRST LINE of 'app/page.tsx' and any component using useState, useEffect, or event handlers.
5. Rich Interactivity (MANDATORY):
   - Every component MUST be feature-complete (60-150 lines of rich JSX each).
   - Implement real working React state (useState), filter buttons, tabs, calculators, sliders, or modals.
   - Use real domain data from 'content' and 'resources.mockData' (never write "// TODO" or "// rest of code...").
6. Styling: Tailwind CSS ONLY. Use designSystem.colors and tokens.
7. Images & Icons: Use verified Unsplash URLs from resources.images and Lucide icons from resources.icons.

Output MUST be a valid JSON object matching:
{
  "files": {
    "app/page.tsx": "// Full code mounting all components...",
    // Provide full, complete code for every file in architecture.fileTree
  }
}
Return ONLY raw JSON with no markdown fences.
`;

  console.log(`[AGENT:Implementation] Calling GPT-4o with ${JSON.stringify(promptPayload).length} char context...`);

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.25,
    max_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemInstruction },
      {
        role: "user",
        content: `Original User Request: "${state.prompt}"\n\nFull Build Context:\n${JSON.stringify(promptPayload, null, 2)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  console.log(`[AGENT:Implementation] Raw response length: ${raw.length} chars`);

  const parsed = extractAndParseJSON<{ files: Record<string, string> }>(raw, { files: {} });

  let generatedFiles = parsed.files || {};

  // Fallback: if files key missing but top-level keys are file paths
  if (Object.keys(generatedFiles).length === 0 && (parsed as any)["app/page.tsx"]) {
    generatedFiles = parsed as unknown as Record<string, string>;
    console.log(`[AGENT:Implementation] ⚠️ Used fallback file extraction`);
  }

  console.log(`[AGENT:Implementation] Files generated: ${Object.keys(generatedFiles).length}`);
  Object.keys(generatedFiles).forEach((path) => {
    const lines = (generatedFiles[path] || "").split("\n").length;
    console.log(`  ↳ ${path} (${lines} lines)`);
  });

  if (Object.keys(generatedFiles).length === 0) {
    console.error(`[AGENT:Implementation] ❌ CRITICAL: No files generated! Raw output preview:\n${raw.substring(0, 500)}`);
  }

  // Merge with existing files (prior turns or sandbox hydration)
  const mergedFiles: Record<string, string> = {
    ...state.files,
    ...generatedFiles,
  };

  // Self-Healing QA: Auto-fix "use client", Unsplash URLs, Zustand imports
  const sanitizedFiles = sanitizeClientComponents(mergedFiles);
  console.log(`[AGENT:Implementation] ✅ Sanitized ${Object.keys(sanitizedFiles).length} files`);

  // Write all files into E2B Sandbox
  if (state.sandboxId) {
    try {
      console.log(`[AGENT:Implementation] Writing files to E2B sandbox: ${state.sandboxId}`);
      const sandbox = await getSandbox(state.sandboxId);
      const allFilesToWrite = { ...SHADCN_UI_FILES, ...sanitizedFiles };

      await Promise.all(
        Object.entries(allFilesToWrite).map(async ([filePath, content]) => {
          await sandbox.files.write(filePath, content);
        })
      );
      console.log(`[AGENT:Implementation] ✅ Written ${Object.keys(allFilesToWrite).length} total files to sandbox`);

      const installed = await autoInstallMissingPackages(sandbox, sanitizedFiles);
      if (installed.length > 0) {
        console.log(`[AGENT:Implementation] ✅ Auto-installed packages: ${installed.join(", ")}`);
      }

      // Ensure Next.js dev server is actively responding on port 3000
      await ensureNextjsServerRunning(sandbox);
    } catch (sandboxErr) {
      console.error(`[AGENT:Implementation] ❌ Sandbox write error:`, sandboxErr);
    }
  } else {
    console.warn(`[AGENT:Implementation] ⚠️ No sandboxId in state — skipping E2B write`);
  }

  await reportProgress(state.projectId, "Writing code & assembling application...", "DONE");
  console.log(`[AGENT:Implementation] 🏁 Done\n`);

  return { files: sanitizedFiles };
}
