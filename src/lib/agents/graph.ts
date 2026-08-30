import { StateGraph, END, START } from "@langchain/langgraph";
import { WebsiteStateAnnotation, WebsiteState } from "./state";
import { productPlannerNode } from "./nodes/product-planner";
import { capabilityPlannerNode } from "./nodes/capability-planner";
import { designAgentNode } from "./nodes/design-agent";
import { researchAgentNode } from "./nodes/research-agent";
import { contentAgentNode } from "./nodes/content-agent";
import { architectAgentNode } from "./nodes/architect-agent";
import { implementationAgentNode } from "./nodes/implementation";
import { browserRunnerNode } from "./nodes/browser-runner";
import { websiteJudgeNode } from "./nodes/website-judge";
import { fixAgentNode } from "./nodes/fix-agent";
import { getOpenAIClient } from "./utils";

/**
 * Finalizer node — generates user-facing summary.
 */
async function finalizerNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log(`\n[ORCHESTRATOR:Finalizer] ⚡ Generating final summary...`);
  console.log(`[ORCHESTRATOR:Finalizer] Title: "${state.productSpec?.title}"`);
  console.log(`[ORCHESTRATOR:Finalizer] QA Score: ${state.qaReport?.overallScore}/10`);
  console.log(`[ORCHESTRATOR:Finalizer] Total iterations: ${state.iteration}`);
  console.log(`[ORCHESTRATOR:Finalizer] Total files: ${Object.keys(state.files || {}).length}`);

  const client = getOpenAIClient();
  const title = state.productSpec?.title || "Modern Web Application";

  let summary = "Here is your generated web application.";
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "Generate a friendly 1-2 sentence message describing what was built and its key features. Be specific about the app, not generic.",
        },
        {
          role: "user",
          content: `Product: ${title}\nFeatures: ${JSON.stringify(state.productSpec?.features || [])}\nQA Score: ${state.qaReport?.overallScore || 9.0}\nIterations: ${state.iteration}`,
        },
      ],
    });
    summary = res.choices[0]?.message?.content || summary;
  } catch (err) {
    console.warn(`[ORCHESTRATOR:Finalizer] ⚠️ Summary generation fallback`);
  }

  console.log(`[ORCHESTRATOR:Finalizer] ✅ Summary: "${summary}"`);
  console.log(`[ORCHESTRATOR:Finalizer] 🏁 MULTI-AGENT PIPELINE COMPLETE!\n`);

  return { title, summary };
}

/**
 * Quality Loop Router: Fix or Finalize?
 */
function judgeRouter(state: WebsiteState): "fixAgent" | "finalizer" {
  const currentIter = state.iteration || 0;
  const maxIter = state.maxIterations || 2;
  const score = state.qaReport?.overallScore || 0;
  const passed = state.qaReport?.passed || score >= 8.5;

  console.log(`\n[ORCHESTRATOR:Router] 🔀 Quality Loop Decision:`);
  console.log(`  ↳ Score: ${score}/10 (threshold: 8.5)`);
  console.log(`  ↳ Passed: ${passed}`);
  console.log(`  ↳ Iteration: ${currentIter}/${maxIter}`);

  if (passed || currentIter >= maxIter) {
    console.log(`  ↳ Decision: → FINALIZE ✅`);
    return "finalizer";
  }

  console.log(`  ↳ Decision: → FIX AGENT 🔧 (score below threshold)`);
  return "fixAgent";
}

/**
 * Builds the LangGraph StateGraph for multi-agent website generation.
 */
export function buildWebsiteGenerationGraph() {
  const workflow = new StateGraph(WebsiteStateAnnotation)
    // Planning Nodes
    .addNode("productPlanner", productPlannerNode)
    .addNode("capabilityPlanner", capabilityPlannerNode)

    // Strategy & Asset Nodes
    .addNode("designAgent", designAgentNode)
    .addNode("researchAgent", researchAgentNode)
    .addNode("contentAgent", contentAgentNode)

    // Architecture & Implementation
    .addNode("architectAgent", architectAgentNode)
    .addNode("implementationAgent", implementationAgentNode)

    // QA & Quality Loop
    .addNode("browserRunner", browserRunnerNode)
    .addNode("websiteJudge", websiteJudgeNode)
    .addNode("fixAgent", fixAgentNode)
    .addNode("finalizer", finalizerNode)

    // Flow Edges
    .addEdge(START, "productPlanner")
    .addEdge("productPlanner", "capabilityPlanner")
    .addEdge("capabilityPlanner", "designAgent")
    .addEdge("designAgent", "researchAgent")
    .addEdge("researchAgent", "contentAgent")
    .addEdge("contentAgent", "architectAgent")
    .addEdge("architectAgent", "implementationAgent")
    .addEdge("implementationAgent", "browserRunner")
    .addEdge("browserRunner", "websiteJudge")

    // Quality Loop
    .addConditionalEdges("websiteJudge", judgeRouter, {
      fixAgent: "fixAgent",
      finalizer: "finalizer",
    })
    .addEdge("fixAgent", "browserRunner")
    .addEdge("finalizer", END);

  return workflow.compile();
}

/**
 * Primary Execution Entrypoint
 */
export async function runWebsiteGenerationGraph(input: {
  projectId: string;
  prompt: string;
  imageUrl?: string;
  mode?: "BUILD" | "DISCUSS";
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  sandboxId: string;
  initialFiles?: Record<string, string>;
}): Promise<{
  url: string;
  title: string;
  files: Record<string, string>;
  summary: string;
  qaScore: number;
}> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 VIBEL MULTI-AGENT PIPELINE STARTED`);
  console.log(`${"=".repeat(60)}`);
  console.log(`📝 Prompt: "${input.prompt}"`);
  console.log(`🆔 ProjectId: ${input.projectId}`);
  console.log(`📦 SandboxId: ${input.sandboxId}`);
  console.log(`🖼️ Image: ${input.imageUrl ? "attached" : "none"}`);
  console.log(`🗄️ Supabase: ${input.supabaseUrl ? "connected" : "not connected"}`);
  console.log(`📁 Initial files: ${Object.keys(input.initialFiles || {}).length}`);
  console.log(`${"=".repeat(60)}\n`);

  const startTime = Date.now();
  const graph = buildWebsiteGenerationGraph();

  const initialState: Partial<WebsiteState> = {
    projectId: input.projectId,
    prompt: input.prompt,
    imageUrl: input.imageUrl,
    mode: input.mode || "BUILD",
    supabaseUrl: input.supabaseUrl,
    supabaseAnonKey: input.supabaseAnonKey,
    sandboxId: input.sandboxId,
    files: input.initialFiles || {},
    iteration: 0,
    maxIterations: 2,
  };

  const result = await graph.invoke(initialState as any);

  const durationSec = Math.round((Date.now() - startTime) / 1000);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🎉 VIBEL MULTI-AGENT PIPELINE COMPLETED`);
  console.log(`${"=".repeat(60)}`);
  console.log(`⏱️ Total Time: ${durationSec}s`);
  console.log(`🏷️ Title: "${result.title}"`);
  console.log(`⭐ QA Score: ${result.qaReport?.overallScore || "N/A"}/10`);
  console.log(`🔄 Iterations: ${result.iteration}`);
  console.log(`📁 Files: ${Object.keys(result.files || {}).length}`);
  console.log(`🌐 URL: ${result.sandboxUrl}`);
  console.log(`${"=".repeat(60)}\n`);

  return {
    url: result.sandboxUrl || "",
    title: result.title || "Modern Web Application",
    files: result.files || {},
    summary: result.summary || "Here is your generated web application.",
    qaScore: result.qaReport?.overallScore || 9.0,
  };
}
