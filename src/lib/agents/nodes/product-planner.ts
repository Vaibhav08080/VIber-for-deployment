import { WebsiteState, ProductSpec } from "../state";
import { PRODUCT_PLANNER_SYSTEM_PROMPT } from "../prompts/system-prompts";
import { getOpenAIClient, extractAndParseJSON, reportProgress } from "../utils";

export async function productPlannerNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:ProductPlanner] ⚡ Starting...`);
  console.log(`[AGENT:ProductPlanner] Prompt: "${state.prompt}"`);
  console.log(`[AGENT:ProductPlanner] Image attached: ${!!state.imageUrl}`);

  await reportProgress(state.projectId, "Understanding requirements & planning...", "RUNNING");

  const client = getOpenAIClient();

  const userMessages: any[] = [];
  if (state.imageUrl) {
    userMessages.push({
      role: "user",
      content: [
        { type: "text", text: `User Prompt: ${state.prompt}` },
        { type: "image_url", image_url: { url: state.imageUrl } },
      ],
    });
  } else {
    userMessages.push({
      role: "user",
      content: `User Prompt: ${state.prompt}`,
    });
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages: [
      { role: "system", content: PRODUCT_PLANNER_SYSTEM_PROMPT },
      ...userMessages,
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  console.log(`[AGENT:ProductPlanner] Raw response: ${raw.substring(0, 300)}...`);

  const defaultSpec: ProductSpec = {
    productType: "web-app",
    title: "Modern Web Application",
    targetAudience: ["General Users"],
    pages: ["/"],
    features: ["Interactive Dashboard", "Feature Showcases", "Responsive Navigation"],
    userFlows: ["Landing page navigation", "Explore features", "Call to Action interaction"],
    keyComponents: ["Navbar", "Hero", "Features", "InteractiveDemo", "Pricing", "Footer"],
  };

  const productSpec = extractAndParseJSON<ProductSpec>(raw, defaultSpec);

  console.log(`[AGENT:ProductPlanner] ✅ Result:`);
  console.log(`  ↳ productType: ${productSpec.productType}`);
  console.log(`  ↳ title: "${productSpec.title}"`);
  console.log(`  ↳ pages: ${productSpec.pages?.join(", ")}`);
  console.log(`  ↳ features (${productSpec.features?.length}): ${productSpec.features?.slice(0, 3).join(", ")}...`);

  await reportProgress(state.projectId, "Understanding requirements & planning...", "DONE");
  console.log(`[AGENT:ProductPlanner] 🏁 Done\n`);

  return {
    productSpec,
    title: productSpec.title || "Modern Web Application",
  };
}
