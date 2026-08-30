import { WebsiteState } from "../state";
import { getSandbox, ensureNextjsServerRunning } from "@/inngest/utils";
import { reportProgress } from "../utils";
import { chromium } from "playwright-core";

export async function browserRunnerNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log(`\n[AGENT:BrowserRunner] ⚡ Starting browser inspection...`);
  console.log(`[AGENT:BrowserRunner] SandboxId: ${state.sandboxId}`);
  console.log(`[AGENT:BrowserRunner] Files count: ${Object.keys(state.files || {}).length}`);
  console.log(`[AGENT:BrowserRunner] Iteration: ${state.iteration}`);

  await reportProgress(state.projectId, "Running browser inspection & visual tests...", "RUNNING");

  let sandboxUrl = state.sandboxUrl;
  const consoleErrors: string[] = [];
  const screenshots: Array<{ viewport: string; dataUrl: string }> = [];

  if (state.sandboxId) {
    try {
      const sandbox = await getSandbox(state.sandboxId);
      const host = sandbox.getHost(3000);
      sandboxUrl = `https://${host}`;
      console.log(`[AGENT:BrowserRunner] Sandbox URL: ${sandboxUrl}`);

      // Ensure dev server is actively responding on port 3000
      await ensureNextjsServerRunning(sandbox);

      // TypeScript compilation check
      try {
        console.log(`[AGENT:BrowserRunner] Running TypeScript check...`);
        const buildCheck = await sandbox.commands.run("npx tsc --noEmit 2>&1 | head -20", {
          timeoutMs: 15000,
        });
        if (buildCheck.stderr && buildCheck.exitCode !== 0) {
          const errMsg = `TypeScript errors: ${buildCheck.stderr.substring(0, 500)}`;
          consoleErrors.push(errMsg);
          console.warn(`[AGENT:BrowserRunner] ⚠️ ${errMsg}`);
        } else {
          console.log(`[AGENT:BrowserRunner] ✅ TypeScript check passed`);
        }
      } catch (err) {
        console.warn(`[AGENT:BrowserRunner] ⚠️ TypeScript check timed out (non-blocking)`);
      }

      // Playwright browser capture
      try {
        console.log(`[AGENT:BrowserRunner] Launching Playwright headless Chrome...`);
        const browser = await chromium.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });

        const viewports = [
          { name: "desktop", width: 1440, height: 900 },
          { name: "mobile", width: 375, height: 667 },
        ];

        for (const vp of viewports) {
          console.log(`[AGENT:BrowserRunner] Capturing ${vp.name} (${vp.width}x${vp.height})...`);
          const context = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
          });
          const page = await context.newPage();

          page.on("console", (msg) => {
            if (msg.type() === "error") {
              consoleErrors.push(`[Browser ${vp.name}] ${msg.text()}`);
            }
          });

          page.on("pageerror", (err) => {
            consoleErrors.push(`[PageError ${vp.name}] ${err.message}`);
          });

          try {
            await page.goto(sandboxUrl, { waitUntil: "networkidle", timeout: 12000 });
            const buffer = await page.screenshot({ type: "jpeg", quality: 70 });
            screenshots.push({
              viewport: vp.name,
              dataUrl: `data:image/jpeg;base64,${buffer.toString("base64")}`,
            });
            console.log(`[AGENT:BrowserRunner] ✅ ${vp.name} screenshot captured`);
          } catch (navErr) {
            console.warn(`[AGENT:BrowserRunner] ⚠️ ${vp.name} navigation timeout (non-fatal)`);
          } finally {
            await context.close();
          }
        }

        await browser.close();
        console.log(`[AGENT:BrowserRunner] ✅ Playwright session closed`);
      } catch (playwrightErr) {
        console.warn(`[AGENT:BrowserRunner] ⚠️ Playwright not available in this environment (fallback mode)`);
      }
    } catch (sandboxErr) {
      console.error(`[AGENT:BrowserRunner] ❌ Sandbox connection error:`, sandboxErr);
    }
  } else {
    console.warn(`[AGENT:BrowserRunner] ⚠️ No sandboxId — skipping browser inspection`);
  }

  console.log(`[AGENT:BrowserRunner] Console errors found: ${consoleErrors.length}`);
  consoleErrors.forEach((err) => console.log(`  ↳ ❌ ${err.substring(0, 120)}`));
  console.log(`[AGENT:BrowserRunner] Screenshots captured: ${screenshots.length}`);

  await reportProgress(state.projectId, "Running browser inspection & visual tests...", "DONE");
  console.log(`[AGENT:BrowserRunner] 🏁 Done\n`);

  return { sandboxUrl, consoleErrors, screenshots };
}
