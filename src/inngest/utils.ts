import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";

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
 * Self-Healing QA: Auto-appends "use client"; to any Next.js React component file
 * that uses client-side hooks, browser APIs, or interactive event handlers.
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

  for (const [path, content] of Object.entries(sanitized)) {
    if (typeof content !== "string") continue;

    // Only inspect TypeScript/React component files
    if (path.endsWith(".tsx") || path.endsWith(".jsx")) {
      const trimmed = content.trim();
      const hasClientHeader =
        trimmed.startsWith('"use client"') ||
        trimmed.startsWith("'use client'");

      if (!hasClientHeader) {
        const needsClientHeader = clientIndicators.some((indicator) =>
          content.includes(indicator)
        );

        if (needsClientHeader) {
          sanitized[path] = `"use client";\n\n${content}`;
        }
      }
    }
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