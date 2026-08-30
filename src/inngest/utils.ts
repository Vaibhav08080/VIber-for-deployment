import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";
import { getFallbackImageForContext } from "@/lib/image-assets";

export async function getSandbox(SandboxId: string) {
  const sandbox = await Sandbox.connect(SandboxId);
  return sandbox;
}

export function lastAssistantTextMessageContent(result: AgentResult) {
  const lastAssistantTextMessageIndex = result.output.findLastIndex(
    (message) => message.role === "assistant"
  );
  const message = result.output[lastAssistantTextMessageIndex] as
    | TextMessage
    | undefined;
  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((content) => content.text).join("")
    : undefined;
}

/**
 * Self-Healing QA Engine: 
 * 1. Auto-sanitizes broken relative/local image paths into HD Unsplash CDN URLs (both JSX attributes and JS object properties).
 * 2. Auto-fixes invalid imports (e.g. Zustand default imports, broken cn paths).
 * 3. Auto-appends "use client"; to any Next.js React component file using hooks or event listeners.
 */
export function sanitizeClientComponents(
  files: Record<string, string>
): Record<string, string> {
  const sanitized = { ...files };

  const clientIndicators = [
    "useState",
    "useEffect",
    "useRef",
    "useContext",
    "useReducer",
    "useCallback",
    "useMemo",
    "useRouter",
    "useParams",
    "usePathname",
    "useSearchParams",
    "useTheme",
    "useAuth",
    "useUser",
    "useClerk",
    "useTRPC",
    "useQuery",
    "useMutation",
    "motion.",
    "AnimatePresence",
    "onClick=",
    "onChange=",
    "onSubmit=",
    "onKeyDown=",
  ];

  let imgCounter = 0;

  for (const [path, fileContent] of Object.entries(sanitized)) {
    if (typeof fileContent !== "string") continue;

    let content = fileContent;

    // --- Fix 1: Auto-fix invalid Zustand default import ---
    content = content.replace(
      /import\s+create\s+from\s+['"]zustand['"]/g,
      'import { create } from "zustand"'
    );

    // --- Fix 2: Auto-fix broken cn utility import path ---
    content = content.replace(
      /from\s+['"]@\/components\/ui\/utils['"]/g,
      'from "@/lib/utils"'
    );

    // --- Fix 3.1: Auto-Sanitize JSX attributes src="..." ---
    content = content.replace(
      /src=["'](?!\/\/|https?:\/\/|data:)([^"']+)["']/g,
      (match, rawSrc) => {
        const replacementUrl = getFallbackImageForContext(`${rawSrc} ${path}`, imgCounter++);
        return `src="${replacementUrl}"`;
      }
    );

    // --- Fix 3.2: Auto-Sanitize JS Object Properties like image: "Diamond Ring", imageUrl: "/ring.jpg" ---
    content = content.replace(
      /(image|imageUrl|img|photo|thumbnail|cover|avatar|banner|url)\s*:\s*["'](?!\/\/|https?:\/\/|data:)([^"']+)["']/g,
      (match, propKey, rawVal) => {
        const replacementUrl = getFallbackImageForContext(`${rawVal} ${propKey} ${path}`, imgCounter++);
        return `${propKey}: "${replacementUrl}"`;
      }
    );

    // --- Fix 4: Ensure client directive ---
    if (path.endsWith(".tsx") || path.endsWith(".jsx") || path.endsWith(".ts")) {
      const trimmed = content.trim();
      const hasClientHeader =
        trimmed.startsWith('"use client"') ||
        trimmed.startsWith("'use client'");

      if (!hasClientHeader) {
        const needsClientHeader = clientIndicators.some((indicator) =>
          content.includes(indicator)
        );

        if (needsClientHeader) {
          content = `"use client";\n\n${content}`;
        }
      }
    }

    sanitized[path] = content;
  }

  return sanitized;
}

/**
 * Self-Healing QA: Detects common third-party package imports in generated code
 * and installs them in E2B sandbox if they are missing.
 */
export async function autoInstallMissingPackages(
  sandbox: Sandbox,
  files: Record<string, string>
): Promise<string[]> {
  const installedPackages: string[] = [];
  const knownPackageMap: Record<string, string> = {
    "framer-motion": "framer-motion",
    recharts: "recharts",
    zustand: "zustand",
    "canvas-confetti": "canvas-confetti @types/canvas-confetti",
    "@supabase/supabase-js": "@supabase/supabase-js",
    "date-fns": "date-fns",
    "lucide-react": "lucide-react",
    clsx: "clsx",
    "tailwind-merge": "tailwind-merge",
  };

  const detectedImports = new Set<string>();

  for (const content of Object.values(files)) {
    if (typeof content !== "string") continue;

    for (const pkg of Object.keys(knownPackageMap)) {
      if (
        content.includes(`from "${pkg}"`) ||
        content.includes(`from '${pkg}'`)
      ) {
        detectedImports.add(pkg);
      }
    }
  }

  const packagesToInstall: string[] = [];

  for (const pkg of Array.from(detectedImports)) {
    const installCmd = knownPackageMap[pkg];
    if (installCmd) {
      packagesToInstall.push(installCmd);
      installedPackages.push(pkg);
    }
  }

  if (packagesToInstall.length > 0) {
    try {
      const combinedCmd = `npm install ${packagesToInstall.join(" ")} --yes`;
      await sandbox.commands.run(combinedCmd);
    } catch (err) {
      console.warn("Auto-install warning:", err);
    }
  }

  return installedPackages;
}

/**
 * Ensures the Next.js dev server is actively running on port 3000 in the E2B sandbox.
 */
export async function ensureNextjsServerRunning(sandbox: Sandbox): Promise<boolean> {
  try {
    const check = await sandbox.commands.run(
      "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || true",
      { timeoutMs: 4000 }
    );
    const code = check.stdout?.trim();
    if (code === "200" || code === "304" || code === "307" || code === "308") {
      return true;
    }

    console.log(`[E2B] Port 3000 status (${code}). Restarting Next.js dev server...`);
    await sandbox.commands.run("pkill -f 'next' || true");
    await sandbox.commands.run("nohup npx next dev --turbopack -p 3000 > /tmp/next.log 2>&1 &");
    
    // Wait up to 5 seconds for port to open
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const verify = await sandbox.commands.run(
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || true",
        { timeoutMs: 3000 }
      );
      const vCode = verify.stdout?.trim();
      if (vCode === "200" || vCode === "304") {
        console.log(`[E2B] Next.js dev server is LIVE on port 3000!`);
        return true;
      }
    }
  } catch (err) {
    console.warn("[E2B] ensureNextjsServerRunning note:", err);
  }
  return false;
}