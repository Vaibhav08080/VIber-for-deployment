import { WebsiteState } from "../state";
import { getOpenAIClient, extractAndParseJSON, reportProgress } from "../utils";
import { getSandbox, sanitizeClientComponents, autoInstallMissingPackages, ensureNextjsServerRunning } from "@/inngest/utils";

export async function fixAgentNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  const currentIter = state.iteration || 0;
  console.log(`\n[AGENT:Fix] ⚡ Starting targeted fix pass ${currentIter + 1}...`);
  console.log(`[AGENT:Fix] QA Score: ${state.qaReport?.overallScore}/10`);
  console.log(`[AGENT:Fix] Issues to fix: ${state.qaReport?.issues?.length || 0}`);
  state.qaReport?.issues?.forEach((issue) => {
    console.log(`  ↳ [${issue.severity}] ${issue.component}: ${issue.description}`);
  });

  await reportProgress(
    state.projectId,
    `Refining UI & applying targeted fixes (Pass ${currentIter + 1})...`,
    "RUNNING"
  );

  const client = getOpenAIClient();

  // Build targeted context: only send files mentioned in issues + affected files
  const affectedComponents = new Set(
    (state.qaReport?.issues || []).map((i) => i.component.toLowerCase())
  );

  const relevantFiles: Record<string, string> = {};
  for (const [path, content] of Object.entries(state.files || {})) {
    // Include files that match issue components or are core files
    const pathLower = path.toLowerCase();
    const isRelevant = affectedComponents.size === 0 ||
      Array.from(affectedComponents).some((comp) => pathLower.includes(comp)) ||
      pathLower.includes("page.tsx");

    if (isRelevant) {
      relevantFiles[path] = content;
    }
  }

  console.log(`[AGENT:Fix] Sending ${Object.keys(relevantFiles).length} relevant files for repair`);

  const fixContext = {
    issues: state.qaReport?.issues || [],
    consoleErrors: state.consoleErrors || [],
    existingFiles: relevantFiles,
  };

  const fixPrompt = `
You are the Surgical Fix Engineer at Vibel.
Apply targeted, precision modifications to resolve ONLY the specific issues listed.
Do NOT rewrite or regenerate untouched files.

Rules:
1. Return FULL corrected contents for each modified file only.
2. Keep "use client"; on first line if file uses React hooks or events.
3. Fix responsive issues with sm:/md:/lg: Tailwind prefixes.
4. Fix broken imports by using correct paths.

Output format:
{
  "fixedFiles": {
    "path/to/modified-file.tsx": "full corrected content..."
  }
}
Return ONLY raw JSON.
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: fixPrompt },
      {
        role: "user",
        content: `Issues and Files:\n${JSON.stringify(fixContext, null, 2)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const parsed = extractAndParseJSON<{ fixedFiles: Record<string, string> }>(raw, { fixedFiles: {} });
  const fixedFiles = parsed.fixedFiles || {};

  console.log(`[AGENT:Fix] Files patched: ${Object.keys(fixedFiles).length}`);
  Object.keys(fixedFiles).forEach((path) => {
    console.log(`  ↳ ✏️ ${path} (${(fixedFiles[path] || "").split("\n").length} lines)`);
  });

  const mergedFiles: Record<string, string> = { ...state.files, ...fixedFiles };
  const sanitized = sanitizeClientComponents(mergedFiles);

  // Write fixed files to sandbox
  if (state.sandboxId && Object.keys(fixedFiles).length > 0) {
    try {
      const sandbox = await getSandbox(state.sandboxId);
      await Promise.all(
        Object.entries(fixedFiles).map(async ([path, content]) => {
          await sandbox.files.write(path, content);
        })
      );
      await autoInstallMissingPackages(sandbox, sanitized);
      await ensureNextjsServerRunning(sandbox);
      console.log(`[AGENT:Fix] ✅ Patches written to sandbox & dev server verified`);
    } catch (err) {
      console.error(`[AGENT:Fix] ❌ Sandbox write error:`, err);
    }
  }

  await reportProgress(
    state.projectId,
    `Refining UI & applying targeted fixes (Pass ${currentIter + 1})...`,
    "DONE"
  );
  console.log(`[AGENT:Fix] 🏁 Done (iteration ${currentIter} → ${currentIter + 1})\n`);

  return {
    files: sanitized,
    iteration: currentIter + 1,
    consoleErrors: [],
  };
}
