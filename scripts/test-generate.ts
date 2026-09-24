import { config } from "dotenv";
config();

import { Sandbox } from "@e2b/code-interpreter";
import { generateBulletproofWebsite } from "../src/lib/agents/generator";

async function runLocalAgentTest() {
  const prompt = process.argv.slice(2).join(" ") || "Build a high-end luxury watch boutique with dark glassmorphism, product catalog, customer reviews, and an interactive shopping cart";

  console.log("\n🚀 ========================================================");
  console.log("   VIBEL MULTI-AGENT PIPELINE TEST (LOCAL)");
  console.log("========================================================\n");
  console.log(`📝 Testing Prompt: "${prompt}"\n`);

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ ERROR: OPENAI_API_KEY is not set in your .env file!");
    process.exit(1);
  }

  if (!process.env.E2B_API_KEY) {
    console.warn("⚠️ WARNING: E2B_API_KEY is not set. E2B Sandbox provisioning might fail if not authenticated.");
  }

  console.log("⏳ [1/4] Provisioning E2B Sandbox ('viber-nextjs')...");
  const sandbox = await Sandbox.create("viber-nextjs", {
    timeoutMs: 30 * 60 * 1000,
  });
  console.log(`✅ Sandbox created successfully! ID: ${sandbox.sandboxId}\n`);

  console.log("🤖 [2/4] Starting Bulletproof Website Generator...");
  const startTime = Date.now();

  const result = await generateBulletproofWebsite({
    projectId: "local-test-project-" + Date.now(),
    prompt: prompt,
    sandboxId: sandbox.sandboxId,
  });

  const durationSec = Math.round((Date.now() - startTime) / 1000);

  console.log("\n========================================================");
  console.log("🎉 GENERATION COMPLETED!");
  console.log("========================================================");
  console.log(`⏱️ Time Taken: ${durationSec}s`);
  console.log(`🏷️ App Title: ${result.title}`);
  console.log(`⭐ Quality Score: ${result.qaScore}/10`);
  console.log(`💬 Summary: ${result.summary}`);
  console.log(`🌐 Live Sandbox Preview URL: ${result.url}`);
  console.log(`📁 Files Generated (${Object.keys(result.files).length}):`);
  
  Object.keys(result.files).forEach((filePath) => {
    const lines = (result.files[filePath] || "").split("\n").length;
    console.log(`   - ${filePath} (${lines} lines)`);
  });

  console.log("\n💡 You can open the Live Sandbox Preview URL in your browser to inspect the result!");
  console.log("========================================================\n");
}

runLocalAgentTest().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});
