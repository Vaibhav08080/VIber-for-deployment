import { WebsiteState } from "../state";
import { getOpenAIClient, extractAndParseJSON, reportProgress } from "../utils";
import {
  getSandbox,
  sanitizeClientComponents,
  autoInstallMissingPackages,
  ensureNextjsServerRunning,
} from "@/inngest/utils";
import { SHADCN_UI_FILES } from "@/lib/shadcn-suite";

/**
 * Patch Agent Node
 *
 * Handles EDIT / FIX requests on an existing generated website.
 * Instead of rebuilding everything, it reads the user's prompt +
 * conversation history + current files and produces ONLY the
 * files that need to change.
 *
 * This is the agent that runs when intentRouter returns "edit_request".
 */
export async function patchAgentNode(
  state: WebsiteState
): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:Patch] ⚡ Starting surgical edit...`);
  console.log(`[AGENT:Patch] Prompt: "${state.prompt}"`);
  console.log(`[AGENT:Patch] Existing files: ${Object.keys(state.files || {}).length}`);
  console.log(`[AGENT:Patch] Conversation history: ${state.conversationHistory?.length || 0} messages`);

  await reportProgress(state.projectId, "Applying your changes...", "RUNNING");

  const client = getOpenAIClient();

  // Build a short, relevant conversation history string for context
  const historyContext = (state.conversationHistory || [])
    .slice(-10)
    .map((m) => `${m.role === "user" ? "USER" : "ASSISTANT"}: ${m.content.substring(0, 400)}`)
    .join("\n\n");

  // Summarize existing files for the LLM (full content for small files)
  const filesSummary: Record<string, string> = {};
  for (const [path, content] of Object.entries(state.files || {})) {
    // Send full content for files under ~200 lines, otherwise send first 80 lines
    const lines = content.split("\n");
    if (lines.length <= 200) {
      filesSummary[path] = content;
    } else {
      filesSummary[path] = lines.slice(0, 80).join("\n") + `\n... [${lines.length - 80} more lines]`;
    }
  }

  const systemPrompt = `You are the Surgical Patch Engineer at Vibel.
A website has already been generated. The user wants to edit or fix something.

CRITICAL RULES:
1. NEVER rewrite the entire application. Only output files that need modification.
2. If the edit is purely visual (color, font, spacing, dark mode), modify ONLY the affected component(s).
3. If the edit adds a feature, add it to the relevant component file and update app/page.tsx imports if needed.
4. If the user says "fix" something specific, only fix that thing.
5. Preserve ALL working code that is unrelated to the edit.
6. Keep "use client"; on the FIRST line of any file that uses React hooks or events.
7. Continue using the same design system (colors, Tailwind classes, Shadcn UI) as the existing codebase.
8. For dark mode changes: use bg-[#09090b] for page, bg-[#18181b] border border-white/10 for cards.

Output format — ONLY the files that changed:
{
  "patchedFiles": {
    "path/to/modified-file.tsx": "COMPLETE corrected file content..."
  },
  "summary": "Brief description of what was changed and why"
}
Return ONLY raw JSON. No markdown fences.`;

  const userMessage = `User Edit Request: "${state.prompt}"

Recent Conversation Context:
${historyContext || "(No prior conversation)"}

Current Website Files:
${JSON.stringify(filesSummary, null, 2)}`;

  console.log(`[AGENT:Patch] Calling GPT-4o with ${userMessage.length} char context...`);

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    max_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  console.log(`[AGENT:Patch] Raw response length: ${raw.length} chars`);

  const parsed = extractAndParseJSON<{
    patchedFiles: Record<string, string>;
    summary: string;
  }>(raw, { patchedFiles: {}, summary: "Applied your changes." });

  const patchedFiles = parsed.patchedFiles || {};
  const patchSummary = parsed.summary || "Applied your changes.";

  console.log(`[AGENT:Patch] Files modified: ${Object.keys(patchedFiles).length}`);
  Object.keys(patchedFiles).forEach((path) => {
    const lines = (patchedFiles[path] || "").split("\n").length;
    console.log(`  ↳ ${path} (${lines} lines)`);
  });

  if (Object.keys(patchedFiles).length === 0) {
    console.warn(`[AGENT:Patch] ⚠️ No files patched — returning existing files unchanged`);
    await reportProgress(state.projectId, "Changes applied!", "DONE");
    return {};
  }

  // Merge patches over existing files (preserve unchanged files)
  const mergedFiles: Record<string, string> = {
    ...state.files,
    ...patchedFiles,
  };

  // Self-healing: ensure "use client" directives are correct
  const sanitizedFiles = sanitizeClientComponents(mergedFiles);

  // Write patched files to E2B sandbox
  if (state.sandboxId) {
    try {
      console.log(`[AGENT:Patch] Writing patched files to E2B sandbox: ${state.sandboxId}`);
      const sandbox = await getSandbox(state.sandboxId);
      const allFilesToWrite = { ...SHADCN_UI_FILES, ...sanitizedFiles };

      await Promise.all(
        Object.entries(allFilesToWrite).map(async ([filePath, content]) => {
          await sandbox.files.write(filePath, content);
        })
      );
      console.log(`[AGENT:Patch] ✅ Written ${Object.keys(patchedFiles).length} patched files to sandbox`);

      // Auto-install any new packages the patch added
      const installed = await autoInstallMissingPackages(sandbox, patchedFiles);
      if (installed.length > 0) {
        console.log(`[AGENT:Patch] ✅ Auto-installed packages: ${installed.join(", ")}`);
      }

      await ensureNextjsServerRunning(sandbox);
    } catch (sandboxErr) {
      console.error(`[AGENT:Patch] ❌ Sandbox write error:`, sandboxErr);
    }
  }

  await reportProgress(state.projectId, "Changes applied!", "DONE");
  console.log(`[AGENT:Patch] ✅ Summary: "${patchSummary}"`);
  console.log(`[AGENT:Patch] 🏁 Done\n`);

  return {
    files: sanitizedFiles,
    summary: patchSummary,
  };
}
