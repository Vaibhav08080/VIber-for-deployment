import { WebsiteState } from "../state";
import { getOpenAIClient, extractAndParseJSON, reportProgress } from "../utils";
import { getSandbox, sanitizeClientComponents, autoInstallMissingPackages, ensureNextjsServerRunning } from "@/inngest/utils";
import { SHADCN_UI_FILES } from "@/lib/shadcn-suite";
import { IMPLEMENTATION_AGENT_SYSTEM_PROMPT } from "../prompts/system-prompts";

/**
 * Implementation Agent Node
 *
 * Generates frontend files SEQUENTIALLY — one file per GPT-4o call.
 * This gives each file a dedicated token budget (~2000 tokens each)
 * instead of cramming all 7 files into one 8,192-token call.
 *
 * Generation order:
 *  1. lib/mock-data.ts  (data first — components depend on it)
 *  2. lib/types.ts      (types second)
 *  3. components/navbar.tsx
 *  4. components/hero.tsx
 *  5. components/[feature-1..N].tsx (each separately)
 *  6. components/footer.tsx
 *  7. app/page.tsx      (last — imports all above)
 */
export async function implementationAgentNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:Implementation] ⚡ Starting sequential code generation...`);
  console.log(`[AGENT:Implementation] Product: "${state.productSpec?.title}" (${state.productSpec?.productType})`);
  console.log(`[AGENT:Implementation] Files to generate: ${state.architecture?.fileTree?.length || 0}`);

  await reportProgress(state.projectId, "Writing code & assembling application...", "RUNNING");

  const client = getOpenAIClient();

  // Build shared context passed to every file generation call
  const sharedContext = {
    productSpec: state.productSpec,
    designSystem: state.designSystem,
    resources: state.resources,
    content: state.content,
    architecture: state.architecture,
    capabilities: state.capabilities,
    supabaseConnected: !!(state.supabaseUrl && state.supabaseAnonKey),
  };

  // Determine the ordered file generation list
  const fileTree = state.architecture?.fileTree || [
    "lib/mock-data.ts",
    "components/navbar.tsx",
    "components/hero.tsx",
    "components/footer.tsx",
    "app/page.tsx",
  ];

  // Sort: data files first, feature components second, app/page.tsx last
  const orderedFiles = [
    ...fileTree.filter(f => f.startsWith("lib/") && !f.includes("supabase")),
    ...fileTree.filter(f => f.includes("navbar")),
    ...fileTree.filter(f => f.includes("hero")),
    ...fileTree.filter(f =>
      f.startsWith("components/") &&
      !f.includes("navbar") &&
      !f.includes("hero") &&
      !f.includes("footer")
    ),
    ...fileTree.filter(f => f.includes("footer")),
    ...fileTree.filter(f => f === "app/page.tsx" || f.startsWith("app/") && !f.includes("api") && !f.includes("actions")),
  ].filter((v, i, arr) => arr.indexOf(v) === i); // deduplicate

  console.log(`[AGENT:Implementation] Generation order:`);
  orderedFiles.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

  const generatedFiles: Record<string, string> = {};
  // Track generated file paths for app/page.tsx to import correctly
  const generatedComponentNames: string[] = [];

  for (const filePath of orderedFiles) {
    // Skip backend files — those are handled by backendAgent
    if (
      filePath.includes("supabase") ||
      filePath.startsWith("app/api/") ||
      filePath.startsWith("app/actions/") ||
      filePath === "middleware.ts"
    ) {
      console.log(`[AGENT:Implementation] ⏭️ Skipping backend file: ${filePath} (handled by backendAgent)`);
      continue;
    }

    console.log(`[AGENT:Implementation] Generating: ${filePath}...`);
    await reportProgress(
      state.projectId,
      `Writing ${filePath.split("/").pop()}...`,
      "RUNNING"
    );

    // Track component names for use in page.tsx generation
    if (filePath.startsWith("components/") && filePath.endsWith(".tsx")) {
      const componentName = filePath
        .replace("components/", "")
        .replace(".tsx", "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");
      generatedComponentNames.push(componentName);
    }

    // Build per-file user prompt
    const alreadyGeneratedSummary = Object.keys(generatedFiles).length > 0
      ? `\nAlready generated files (reference for imports & consistency):\n${
          Object.entries(generatedFiles)
            .map(([p, c]) => `// ${p}\n${c.split("\n").slice(0, 20).join("\n")}`)
            .join("\n\n---\n\n")
        }`
      : "";

    const fileSpecificInstruction = filePath === "app/page.tsx"
      ? `Generate the main entry point 'app/page.tsx' that:
1. Has "use client"; on the VERY FIRST LINE
2. Imports and renders ALL of these components in order: ${generatedComponentNames.join(", ")}
3. Sets up the page with proper min-h-screen bg-[#09090b] text-white
4. DO NOT export metadata from app/page.tsx because it is a Client Component ("use client"). Metadata is handled in app/layout.tsx.`
      : filePath === "lib/mock-data.ts"
      ? `Generate 'lib/mock-data.ts' with rich, realistic mock data arrays for this product.
Include at least 6-8 items with realistic names, descriptions, prices, ratings, images (Unsplash URLs), etc.
Export named constants like: export const ITEMS = [...], export const TESTIMONIALS = [...], export const FEATURES = [...]`
      : `Generate the complete '${filePath}' component.
- Must have "use client"; on line 1 if using React hooks or event handlers
- Must be 80-150+ lines of rich, feature-complete JSX
- Use real data from mock-data.ts and the content package
- Implement real interactive state (useState, tabs, filters, modals, etc.)`;

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.2,
        max_tokens: 3000,
        messages: [
          {
            role: "system",
            content: IMPLEMENTATION_AGENT_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Original Request: "${state.prompt}"

FILE TO GENERATE: ${filePath}
${fileSpecificInstruction}

Shared Build Context:
${JSON.stringify(sharedContext, null, 2)}
${alreadyGeneratedSummary}

OUTPUT: Return ONLY the raw TypeScript/TSX code for '${filePath}'.
No JSON wrapper. No markdown fences. Just the code.`,
          },
        ],
      });

      let code = response.choices[0]?.message?.content || "";
      // Strip markdown fences if the model adds them despite instructions
      code = code.replace(/^```(?:tsx?|typescript|javascript)?\n?/gm, "").replace(/```$/gm, "").trim();

      generatedFiles[filePath] = code;
      const lineCount = code.split("\n").length;
      console.log(`[AGENT:Implementation] ✅ ${filePath} (${lineCount} lines)`);
    } catch (err) {
      console.error(`[AGENT:Implementation] ❌ Failed to generate ${filePath}:`, err);
    }
  }

  console.log(`\n[AGENT:Implementation] Total files generated: ${Object.keys(generatedFiles).length}`);

  // Merge with existing files
  const mergedFiles: Record<string, string> = {
    ...state.files,
    ...generatedFiles,
  };

  // Self-healing: fix "use client" directives
  const sanitizedFiles = sanitizeClientComponents(mergedFiles);
  console.log(`[AGENT:Implementation] ✅ Sanitized ${Object.keys(sanitizedFiles).length} files`);

  // Write all files to E2B sandbox
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

      await ensureNextjsServerRunning(sandbox);
    } catch (sandboxErr) {
      console.error(`[AGENT:Implementation] ❌ Sandbox write error:`, sandboxErr);
    }
  } else {
    console.warn(`[AGENT:Implementation] ⚠️ No sandboxId — skipping E2B write`);
  }

  await reportProgress(state.projectId, "Writing code & assembling application...", "DONE");
  console.log(`[AGENT:Implementation] 🏁 Done\n`);

  return { files: sanitizedFiles };
}
