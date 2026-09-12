import { buildWebsiteGenerationGraph } from "../src/lib/agents/graph";

function testGraphCompilation() {
  console.log("Testing LangGraph StateGraph compilation...");
  try {
    const compiledGraph = buildWebsiteGenerationGraph();
    console.log("✅ Successfully compiled StateGraph!");
    
    // Check nodes
    const nodeKeys = Object.keys((compiledGraph as any).nodes || {});
    console.log(`✅ Registered Nodes (${nodeKeys.length}):`, nodeKeys.join(", "));
    
    console.log("🎉 All LangGraph compilation checks passed successfully!");
  } catch (error) {
    console.error("❌ Graph compilation error:", error);
    process.exit(1);
  }
}

testGraphCompilation();
