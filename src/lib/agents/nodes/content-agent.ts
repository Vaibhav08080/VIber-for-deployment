import { WebsiteState, ContentPackage } from "../state";
import { CONTENT_AGENT_SYSTEM_PROMPT } from "../prompts/system-prompts";
import { getGeminiClient, extractAndParseJSON } from "../utils";

export async function contentAgentNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:Content] ⚡ Starting...`);
  console.log(`[AGENT:Content] Product: "${state.productSpec?.title}"`);

  const { client, model, isGemini } = getGeminiClient();
  console.log(`[AGENT:Content] 🤖 Using provider: ${isGemini ? "Google Gemini" : "OpenAI"} (${model})`);

  const response = await client.chat.completions.create({
    model,
    temperature: 0.3,
    messages: [
      { role: "system", content: CONTENT_AGENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Product Spec:\n${JSON.stringify(state.productSpec, null, 2)}\n\nCapabilities:\n${JSON.stringify(state.capabilities, null, 2)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const defaultContent: ContentPackage = {
    brandName: state.productSpec?.title || "Vibel App",
    tagline: "The modern platform built for high-velocity teams",
    heroHeadline: `Supercharge your workflow with ${state.productSpec?.title || "Next-Gen AI"}`,
    heroSubheadline: "Experience unmatched speed, modular architecture, and stunning visual precision.",
    ctaText: "Get Started Now",
    featureHeadlines: [
      { title: "Real-Time Intelligence", description: "Harness autonomous multi-agent pipelines." },
      { title: "Glassmorphism UI", description: "Pixel-perfect components with fluid animations." },
      { title: "Enterprise Reliability", description: "Built on battle-tested sandboxed environments." },
    ],
    testimonialQuotes: [
      { author: "Alex Rivera", role: "VP of Product", text: "Transformed our velocity by 4x.", rating: 5 },
    ],
    faqItems: [
      { question: "How does it work?", answer: "Specialized agents plan, design, and build autonomously." },
    ],
    seoMeta: {
      title: `${state.productSpec?.title || "Vibel"} — Next-Gen Web Application`,
      description: "State-of-the-art web application.",
    },
  };

  const content = extractAndParseJSON<ContentPackage>(raw, defaultContent);

  console.log(`[AGENT:Content] ✅ Content generated:`);
  console.log(`  ↳ brandName: "${content.brandName}"`);
  console.log(`  ↳ heroHeadline: "${content.heroHeadline}"`);
  console.log(`  ↳ tagline: "${content.tagline}"`);
  console.log(`  ↳ features: ${content.featureHeadlines?.length}`);
  console.log(`  ↳ testimonials: ${content.testimonialQuotes?.length}`);
  console.log(`  ↳ FAQs: ${content.faqItems?.length}`);
  console.log(`[AGENT:Content] 🏁 Done\n`);

  return { content };
}
