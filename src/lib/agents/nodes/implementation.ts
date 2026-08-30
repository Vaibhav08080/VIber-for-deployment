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
You are generating a complete, production-ready Next.js 15 web application.

CRITICAL: You MUST use ALL data from the "content" and "resources" objects below.
The content object contains domain-specific copy, brand name, testimonials, FAQs etc.
generated specifically for this product — DO NOT invent generic placeholder content.

Strict Technical Rules:
1. Entry Point: 'app/page.tsx' MUST be the main page.
2. Client Components: MUST put "use client"; on the VERY FIRST LINE of 'app/page.tsx' and any component file using useState, useEffect, or event handlers.
3. Modular Architecture: Create each component file under 'components/*.tsx' EXACTLY as defined in architecture.fileTree.
4. Styling: Tailwind CSS ONLY. Use designSystem.tokens values verbatim.
5. Icons: Lucide-react icons — use the exact icon names from resources.icons.
6. Images: Use verified Unsplash CDN URLs from resources.images. Map keys like "hero", "avatar1", "feature1" to their URLs.
7. Zero Placeholders: Provide 100% complete code. NEVER write "// TODO", "// rest of code...", or partial implementations.
8. Use content.brandName, content.heroHeadline, content.testimonialQuotes[], content.faqItems[], content.featureHeadlines[] verbatim.

Output MUST be a valid JSON object:
{
  "files": {
    "app/page.tsx": "...",
    "components/navbar.tsx": "...",
    "components/hero.tsx": "...",
    "components/features.tsx": "...",
    "components/interactive-section.tsx": "...",
    "components/testimonials.tsx": "...",
    "components/faq.tsx": "...",
    "components/footer.tsx": "...",
    "lib/mock-data.ts": "..."
  }
}
Return ONLY raw JSON with no markdown fences.
`;

  console.log(`[AGENT:Implementation] Calling GPT-4o with ${JSON.stringify(promptPayload).length} char context...`);

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
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
