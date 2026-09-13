import { WebsiteState } from "../state";
import { getOpenAIClient, getGeminiClient, reportProgress } from "../utils";

/**
 * Intent Router Node
 *
 * Runs BEFORE the product planner. Analyzes the user's prompt +
 * conversation history + existing files to detect whether this is:
 *  - "new_project"  → full pipeline (planner → design → implementation)
 *  - "edit_request" → surgical patch only (patchAgent → QA loop)
 *
 * This is what stops follow-up messages like "can u fix rhis" or
 * "make the header blue" from nuking the entire existing app.
 */

const EDIT_KEYWORDS = [
  "fix", "repair", "update", "change", "modify", "edit", "adjust",
  "make it", "make the", "remove", "add to", "improve", "refactor",
  "tweak", "rename", "dark", "light", "color", "font", "spacing",
  "button", "navbar", "footer", "hero", "smaller", "bigger", "faster",
  "responsive", "mobile", "animation", "style", "design", "layout",
  "error", "broken", "doesn't work", "not working", "bug", "crash",
  "ek aur", "thoda", "thodi", "bitr", "badlo", "theek",
];

const NEW_PROJECT_KEYWORDS = [
  "create", "build", "make a", "make an", "generate", "new website",
  "new app", "i want a", "i need a", "develop", "launch",
];

export async function intentRouterNode(
  state: WebsiteState
): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:IntentRouter] ⚡ Analyzing intent...`);
  console.log(`[AGENT:IntentRouter] Prompt: "${state.prompt}"`);
  console.log(`[AGENT:IntentRouter] Existing files: ${Object.keys(state.files || {}).length}`);
  console.log(`[AGENT:IntentRouter] Conversation messages: ${state.conversationHistory?.length || 0}`);

  const hasExistingFiles = Object.keys(state.files || {}).length > 0;
  const prompt = (state.prompt || "").toLowerCase();

  // --- Heuristic fast-path ---
  // If no existing files exist, it's always a new project
  if (!hasExistingFiles) {
    console.log(`[AGENT:IntentRouter] ✅ Decision: NEW_PROJECT (no existing files)`);
    return { intent: "new_project" };
  }

  // If prompt explicitly asks to build something brand new
  const isExplicitlyNew = NEW_PROJECT_KEYWORDS.some((kw) => prompt.includes(kw));
  if (isExplicitlyNew) {
    console.log(`[AGENT:IntentRouter] ✅ Decision: NEW_PROJECT (new-project keywords matched)`);
    return { intent: "new_project" };
  }

  // If prompt contains edit/fix keywords, it's an edit
  const isExplicitEdit = EDIT_KEYWORDS.some((kw) => prompt.includes(kw));
  if (isExplicitEdit) {
    console.log(`[AGENT:IntentRouter] ✅ Decision: EDIT_REQUEST (edit keywords matched: "${EDIT_KEYWORDS.find((kw) => prompt.includes(kw))}")`);
    return { intent: "edit_request" };
  }

  // --- LLM disambiguation for ambiguous prompts ---
  console.log(`[AGENT:IntentRouter] Ambiguous prompt — using LLM to classify intent...`);

  try {
    await reportProgress(state.projectId, "Understanding your request...", "RUNNING");

    const { client, model } = getGeminiClient();
    const recentHistory = (state.conversationHistory || [])
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content.substring(0, 200)}`)
      .join("\n");

    const response = await client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an intent classifier for an AI website builder.
Given a user's prompt and conversation history, classify the intent as either:
- "new_project": The user wants to build a completely new website/app from scratch
- "edit_request": The user wants to modify, fix, or edit an existing website that was already generated

Return JSON: { "intent": "new_project" | "edit_request", "reason": "brief explanation" }`,
        },
        {
          role: "user",
          content: `Current Prompt: "${state.prompt}"\n\nRecent Conversation:\n${recentHistory || "None"}\n\nExisting files in project: ${Object.keys(state.files || {}).slice(0, 5).join(", ")}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    const intent: "new_project" | "edit_request" =
      parsed.intent === "edit_request" ? "edit_request" : "new_project";

    console.log(`[AGENT:IntentRouter] ✅ LLM Decision: ${intent.toUpperCase()} (${parsed.reason})`);
    await reportProgress(state.projectId, "Understanding your request...", "DONE");

    return { intent };
  } catch (err) {
    // Conservative fallback: if in doubt and files exist, treat as edit
    console.warn(`[AGENT:IntentRouter] ⚠️ LLM classification failed, falling back to EDIT_REQUEST`);
    return { intent: "edit_request" };
  }
}

/**
 * Router function used by LangGraph's conditional edge.
 * Routes to the correct pipeline branch based on detected intent.
 */
export function intentRouterEdge(
  state: WebsiteState
): "productPlanner" | "patchAgent" {
  const intent = state.intent || "new_project";
  console.log(`[ORCHESTRATOR:IntentEdge] → ${intent === "edit_request" ? "patchAgent" : "productPlanner"}`);
  return intent === "edit_request" ? "patchAgent" : "productPlanner";
}
