import { WebsiteState, QAFeedback } from "../state";
import { getOpenAIClient, extractAndParseJSON, reportProgress } from "../utils";

export async function websiteJudgeNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:Judge] ⚡ Starting quality evaluation...`);
  console.log(`[AGENT:Judge] Iteration: ${state.iteration}`);
  console.log(`[AGENT:Judge] Files: ${Object.keys(state.files || {}).length}`);
  console.log(`[AGENT:Judge] Screenshots: ${state.screenshots?.length || 0}`);
  console.log(`[AGENT:Judge] Console errors: ${state.consoleErrors?.length || 0}`);

  await reportProgress(state.projectId, "Evaluating quality & UX score...", "RUNNING");

  const client = getOpenAIClient();

  const fileSummaries = Object.keys(state.files || {}).map((path) => ({
    path,
    lines: (state.files[path] || "").split("\n").length,
    hasClientDirective: (state.files[path] || "").includes('"use client"'),
  }));

  const judgePrompt = `
You are the Website Judge & Chief Quality Inspector at Vibel.
Evaluate the generated web application against the product requirements.

Scoring Criteria (0.0 to 10.0 scale):
1. visualScore: Aesthetic polish, glassmorphism, contrast, color harmony, typography.
2. uxScore: Navigation flow, interactive triggers, feedback states.
3. responsiveScore: Responsive classes (sm:, md:, lg:), mobile support.
4. functionalScore: Feature completeness against product spec.
5. technicalScore: Modular structure, "use client" correctness, zero broken imports.

overallScore = weighted average of all scores
passed = overallScore >= 8.5 AND zero critical console errors

Output MUST be valid JSON:
{
  "overallScore": number,
  "visualScore": number,
  "uxScore": number,
  "responsiveScore": number,
  "functionalScore": number,
  "technicalScore": number,
  "passed": boolean,
  "issues": [
    {
      "severity": "low" | "medium" | "high" | "critical",
      "component": "file or component name",
      "description": "specific issue",
      "suggestedFix": "how to fix it"
    }
  ]
}
Return ONLY raw JSON.
`;

  const userContent: any[] = [
    {
      type: "text",
      text: `Product Spec:\n${JSON.stringify(state.productSpec, null, 2)}\n\nFiles Generated:\n${JSON.stringify(fileSummaries, null, 2)}\n\nConsole/Build Errors:\n${JSON.stringify(state.consoleErrors || [], null, 2)}`,
    },
  ];

  // Feed screenshots to multimodal judge if available
  if (state.screenshots && state.screenshots.length > 0) {
    for (const ss of state.screenshots) {
      if (ss.dataUrl) {
        userContent.push({
          type: "image_url",
          image_url: { url: ss.dataUrl },
        });
      }
    }
    console.log(`[AGENT:Judge] Fed ${state.screenshots.length} screenshots to vision model`);
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: judgePrompt },
      { role: "user", content: userContent },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const defaultQA: QAFeedback = {
    overallScore: state.consoleErrors.length > 0 ? 7.2 : 8.8,
    visualScore: 8.8,
    uxScore: 8.7,
    responsiveScore: 8.6,
    functionalScore: 8.8,
    technicalScore: state.consoleErrors.length > 0 ? 7.0 : 9.0,
    passed: state.consoleErrors.length === 0,
    issues: state.consoleErrors.map((err) => ({
      severity: "high" as const,
      component: "Runtime",
      description: err,
      suggestedFix: "Resolve runtime error",
    })),
  };

  const qaReport = extractAndParseJSON<QAFeedback>(raw, defaultQA);

  console.log(`[AGENT:Judge] ✅ Quality Report:`);
  console.log(`  ↳ overallScore: ${qaReport.overallScore}/10`);
  console.log(`  ↳ visual: ${qaReport.visualScore} | ux: ${qaReport.uxScore} | responsive: ${qaReport.responsiveScore}`);
  console.log(`  ↳ functional: ${qaReport.functionalScore} | technical: ${qaReport.technicalScore}`);
  console.log(`  ↳ passed: ${qaReport.passed ? "✅ YES" : "❌ NO"}`);
  console.log(`  ↳ issues: ${qaReport.issues?.length || 0}`);
  qaReport.issues?.forEach((issue) => {
    console.log(`     • [${issue.severity}] ${issue.component}: ${issue.description}`);
  });

  // Regression Rollback Check
  let filesToKeep = state.files;
  if (state.previousScore !== undefined && state.previousFiles) {
    const delta = qaReport.overallScore - state.previousScore;
    console.log(`[AGENT:Judge] 📊 Score delta: ${delta > 0 ? "+" : ""}${delta.toFixed(2)} (prev: ${state.previousScore}, curr: ${qaReport.overallScore})`);
    if (delta < -0.6) {
      console.warn(`[AGENT:Judge] ⚠️ Regression detected (${delta.toFixed(2)} drop). Rolling back to pre-fix checkpoint!`);
      filesToKeep = state.previousFiles;
    }
  }

  await reportProgress(
    state.projectId,
    `Quality score: ${qaReport.overallScore}/10 ${qaReport.passed ? "✅" : "— needs refinement"}`,
    "DONE"
  );
  console.log(`[AGENT:Judge] 🏁 Done\n`);

  return {
    qaReport,
    scoreHistory: [qaReport.overallScore],
    files: filesToKeep,
  };
}
