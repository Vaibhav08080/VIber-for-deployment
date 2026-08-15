# Bolt.diy vs SparkSite — Complete Feature Gap Analysis & Future Reference

> Created after deep audit of `codebolt/bolt.diy` (11,974 commits) vs `VIber-for-deployment`. This file serves as a permanent reference guide for future feature implementation — when building any new feature, read the relevant section here for architecture patterns, code snippets, and Bolt's approach.

---

## 📊 Master Feature Comparison Matrix

| Category | Feature | Bolt.diy | SparkSite | Priority |
|:---|:---|:---|:---|:---|
| **AI Engine** | Multi-LLM Provider (22 providers) | ✅ Full | ❌ Only OpenAI + Gemini stub | 🔴 HIGH |
| **AI Engine** | Live model switcher in chat UI | ✅ | ❌ | 🟡 MEDIUM |
| **AI Engine** | Chain-of-thought ThoughtBox (DeepSeek/R1) | ✅ | ❌ | 🟡 MEDIUM |
| **AI Engine** | Prompt enhancer (Bolt's `api.enhancer.ts`) | ✅ | ✅ Basic | 🟢 LOW |
| **Code Gen** | Streaming XML artifact renderer | ✅ `<boltArtifact>` | ❌ JSON tool calls | 🔴 HIGH |
| **Code Gen** | Full system prompt (700+ lines, structured XML) | ✅ | ✅ Now ported | 🟢 DONE |
| **Code Gen** | Shadcn UI 20+ components pre-hydrated | ✅ | ✅ Now done | 🟢 DONE |
| **Code Gen** | Design scheme injection (font/palette/features) | ✅ | ❌ | 🟡 MEDIUM |
| **Code Gen** | Starter templates (Next.js, Vite, Vue, Svelte) | ✅ | ❌ | 🟡 MEDIUM |
| **Supabase** | Full OAuth connection flow + project selector | ✅ | ✅ Basic | 🟢 LOW |
| **Supabase** | Auto SQL migration runner via boltAction | ✅ | ❌ | 🔴 HIGH |
| **Supabase** | RLS policy auto-generation | ✅ | ❌ | 🟡 MEDIUM |
| **Supabase** | Stats panel (tables, storage, auth users) | ✅ | ❌ | 🟡 MEDIUM |
| **Database** | Supabase query execution API (`api.supabase.query.ts`) | ✅ | ❌ | 🔴 HIGH |
| **MCP** | Model Context Protocol tool integration | ✅ | ❌ | 🟡 MEDIUM |
| **MCP** | MCP server config UI (add/remove servers) | ✅ | ❌ | 🟡 MEDIUM |
| **MCP** | MCP availability checker | ✅ | ❌ | 🟡 MEDIUM |
| **Deploy** | 1-click Vercel deployment | ✅ | ❌ | 🔴 HIGH |
| **Deploy** | 1-click Netlify deployment | ✅ | ❌ | 🔴 HIGH |
| **Git** | Git clone from GitHub/GitLab URL into sandbox | ✅ | ❌ | 🟡 MEDIUM |
| **Git** | GitHub OAuth + branch/PR sync | ✅ | ✅ Export only | 🟡 MEDIUM |
| **Git** | GitLab integration | ✅ | ❌ | 🟡 MEDIUM |
| **Workbench** | Live file tree panel | ✅ | ❌ | 🟡 MEDIUM |
| **Workbench** | Inline code editor (Monaco) | ✅ | ❌ | 🟡 MEDIUM |
| **Workbench** | Diff view for file changes | ✅ `DiffView.tsx` | ❌ | 🟡 MEDIUM |
| **Workbench** | File search | ✅ `Search.tsx` | ❌ | 🟡 MEDIUM |
| **Preview** | Live app preview panel | ✅ | ✅ E2B iframe | 🟢 DONE |
| **Preview** | Screenshot selector for bug reports | ✅ | ❌ | 🟡 MEDIUM |
| **Preview** | QR code preview for mobile | ✅ | ❌ | 🟡 MEDIUM |
| **Terminal** | Live terminal in UI | ✅ | ❌ | 🔴 HIGH |
| **Terminal** | Self-healing error listener (reads stderr) | ✅ | ❌ | 🔴 HIGH |
| **Image** | Dynamic HD Unsplash asset resolver | ❌ (Pexels only) | ✅ | 🟢 DONE |
| **Image** | Auto-sanitizer for broken image URLs | ❌ | ✅ | 🟢 DONE |
| **Web Search** | AI-powered web search with citations | ✅ `api.web-search.ts` | ❌ | 🟡 MEDIUM |
| **Settings** | Feature flags toggle panel | ✅ | ❌ | 🟡 MEDIUM |
| **Settings** | Event log / debug panel | ✅ | ❌ | 🟡 MEDIUM |
| **Settings** | Profile + avatar management | ✅ | ❌ Clerk | 🟢 LOW |
| **UI** | ThoughtBox (AI reasoning expander) | ✅ | ❌ | 🟡 MEDIUM |
| **UI** | Skeleton loaders / progress compilation | ✅ | ✅ Partial | 🟢 LOW |
| **UI** | Import folder from local disk | ✅ | ❌ | 🟡 MEDIUM |
| **Auth** | Clerk authentication | ❌ | ✅ | 🟢 DONE |
| **Auth** | Billing / usage tracking | ❌ | ✅ | 🟢 DONE |

---

## 🗂️ Bolt.diy Codebase Architecture Reference

### Folder Structure
```
bolt.diy/app/
├── components/
│   ├── @settings/          # All settings panels (tabs: providers, mcp, supabase, github, vercel, netlify)
│   ├── chat/               # Chat UI components (Artifact, ModelSelector, MCPTools, SupabaseConnection)
│   ├── workbench/          # Code editor, file tree, diff view, preview panel
│   ├── editor/             # Monaco editor wrapper
│   ├── deploy/             # Vercel & Netlify deploy buttons
│   └── ui/                 # Base UI components
├── lib/
│   ├── common/prompts/     # System prompts (prompts.ts, new-prompt.ts, optimized.ts, discuss-prompt.ts)
│   ├── modules/llm/        # LLM provider manager + 22 provider implementations
│   ├── stores/             # Nanostores state (workbench, files, mcp, supabase, vercel, netlify, github)
│   ├── hooks/              # useGit, useMessageParser, useChatHistory
│   ├── services/           # mcpService, cacheService
│   └── persistence/        # IndexedDB chat history
└── routes/
    ├── api.chat.ts         # Main streaming chat endpoint
    ├── api.supabase.ts     # Supabase project fetcher
    ├── api.supabase.query.ts # Execute SQL on live Supabase
    ├── api.enhancer.ts     # Prompt enhancement
    ├── api.mcp-check.ts    # MCP server availability check
    ├── api.mcp-update-config.ts # MCP config update
    ├── api.vercel-deploy.ts # 1-click Vercel deploy
    ├── api.netlify-deploy.ts # 1-click Netlify deploy
    └── api.web-search.ts   # Web search with citations
```

---

## 🔧 Future Feature Reference: Code Patterns from Bolt

### 1. Multi-LLM Provider Manager Pattern
**File:** `bolt.diy/app/lib/modules/llm/manager.ts`

Bolt uses a singleton `LLMManager` class that dynamically registers all provider classes from the `providers/` directory. Each provider extends `BaseProvider` and declares `staticModels: ModelInfo[]` and implements `chat(params)`.

```typescript
// Pattern to implement in SparkSite: src/lib/llm/manager.ts
export class LLMManager {
  private static _instance: LLMManager;
  private _providers: Map<string, BaseProvider> = new Map();

  static getInstance(): LLMManager { ... }
  registerProvider(provider: BaseProvider) { ... }
  getProvider(name: string): BaseProvider | undefined { ... }
}
```

**22 providers available:** `openai`, `anthropic`, `google`, `deepseek`, `groq`, `ollama`, `openrouter`, `mistral`, `cohere`, `hyperbolic`, `fireworks`, `together`, `cerebras`, `amazon-bedrock`, `huggingface`, `lmstudio`, `github`, `perplexity`, `xai`, `moonshot`, `z-ai`, `openai-like`.

---

### 2. Supabase Full Integration Pattern
**Files:** `bolt.diy/app/lib/stores/supabase.ts`, `app/routes/api.supabase.ts`, `api.supabase.query.ts`

Bolt's Supabase integration uses `nanostores` atoms (SparkSite equivalent: Zustand) to persist:
```typescript
interface SupabaseConnectionState {
  user: SupabaseUser | null;
  token: string;
  stats?: SupabaseStats;        // All user Supabase projects
  selectedProjectId?: string;   // Active project
  isConnected?: boolean;
  project?: SupabaseProject;    // Active project details (region, DB, host)
  credentials?: {
    anonKey: string;
    supabaseUrl: string;
  };
}
```

**Key API Endpoints:**
- `POST /api/supabase` → fetch all projects for a given token
- `POST /api/supabase/variables` → get anon/service_role keys for a project
- `POST /api/supabase/query` → execute raw SQL on live Supabase DB
- `GET  /api/supabase-user` → fetch user info via token

**Supabase Stats model in prompt:**
```typescript
stats?: {
  database?: { tables: number; size: string; views?: number; functions?: number; };
  storage?: { objects: number; size: string; buckets?: number; };
  functions?: { count: number; deployed?: number; };
  auth?: { users: number; };
}
```

---

### 3. MCP (Model Context Protocol) Integration Pattern
**Files:** `bolt.diy/app/lib/stores/mcp.ts`, `app/routes/api.mcp-check.ts`, `api.mcp-update-config.ts`, `app/components/chat/MCPTools.tsx`

MCP state is stored in `localStorage` under key `mcp_settings`:
```typescript
type MCPSettings = {
  mcpConfig: {
    mcpServers: Record<string, {
      url: string;
      type: "sse" | "http";
    }>;
  };
  maxLLMSteps: number; // Default: 5
};
```

**Bolt MCP Flow:**
1. User opens MCPTools dialog, adds server URL.
2. `POST /api/mcp-update-config` saves config and returns tool list from server.
3. `GET /api/mcp-check` pings each server to check availability.
4. Available tools are injected into the system prompt context for each request.

**SparkSite Implementation:** Would need a `src/app/api/mcp-check/route.ts` and `src/app/api/mcp-update-config/route.ts`, plus a `MCPSettingsModal.tsx` under `src/modules/projects/ui/components/`.

---

### 4. 1-Click Vercel/Netlify Deploy Pattern
**Files:** `api.vercel-deploy.ts` (14KB), `api.netlify-deploy.ts` (8.4KB)

Bolt's deploy flow:
1. User clicks deploy button in header.
2. Frontend sends project files + env vars to `POST /api/vercel-deploy`.
3. API calls Vercel's REST API using user's stored `VITE_VERCEL_ACCESS_TOKEN`.
4. Returns deployment URL which is shown in a success toast.

**Key Vercel API used:**
```typescript
// Create deployment
POST https://api.vercel.com/v13/deployments
Authorization: Bearer {token}
Body: { name, files: [{file, data, encoding}], projectSettings: { framework: "nextjs" } }
```

---

### 5. AI Chain-of-Thought ThoughtBox Pattern
**File:** `bolt.diy/app/components/chat/ThoughtBox.tsx`

Simple collapsible component shown when AI returns `<thinking>...</thinking>` tags (DeepSeek-R1, Claude 3.7 with extended thinking):
```tsx
function ThoughtBox({ title, children }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div onClick={() => setIsExpanded(!isExpanded)} className="...">
      <div>🧠 {title} {!isExpanded && <span>- Click to expand</span>}</div>
      {isExpanded && <div>{children}</div>}
    </div>
  );
}
```

**SparkSite Implementation:** Parse `<thinking>` tags in `sanitizeClientComponents()` in `src/inngest/utils.ts`. Render as collapsible accordion in `message-card.tsx`.

---

### 6. Design Scheme Injection Pattern
**Files:** `bolt.diy/types/design-scheme.ts`, injected via `getSystemPrompt(cwd, supabase, designScheme)`

Bolt lets users choose font + color palette in settings, which gets injected into the system prompt:
```typescript
interface DesignScheme {
  font?: { family: string; style: "serif" | "sans-serif" | "monospace"; };
  palette?: {
    primary: string;    // e.g. "#7C3AED"
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  features?: string[];  // e.g. ["dark-mode", "glassmorphism", "animations"]
}
```

**SparkSite Implementation:** Add a "Design Theme" panel in `message-form.tsx` with preset palettes (Purple/Indigo, Dark Emerald, Amber/Warm). Pass chosen palette to `PROMPT` as a dynamic string.

---

### 7. Starter Templates Pattern
**File:** `bolt.diy/app/components/chat/StarterTemplates.tsx`

Maps a list of `STARTER_TEMPLATES` (Next.js, Vite+React, Vue, Svelte, Astro, Remix, etc.) from GitHub template repos. Each template has:
```typescript
interface Template {
  name: string;
  label: string;          // "Next.js"
  githubRepo: string;     // "stackblitz-labs/bolt-nextjs-shadcn"
  icon: string;           // CSS icon class
  tags: string[];
}
```

**SparkSite Implementation:** Add template cards to the home/new project page that pre-fill the prompt textarea with starter-specific instructions.

---

### 8. Git Clone / Import Pattern
**File:** `bolt.diy/app/components/chat/GitCloneButton.tsx`

Uses `useGit()` hook that calls `isomorphic-git` (browser-based Git implementation) to clone repos into the in-browser WebContainer. Max file sizes: 100KB per file, 500KB total. Ignores `node_modules`, `.git`, `dist`, `.next`, `.cache`.

**SparkSite Implementation:** Could use GitHub's REST API to fetch a repo's file tree and contents, then hydrate them into the E2B sandbox before running the agent.

---

## 🏆 Recommended Implementation Roadmap for SparkSite

### Phase 1 — Already Done ✅
- Bolt's master system prompt ported → `src/prompt.ts`
- Full 20+ Shadcn UI suite pre-hydrated → `src/lib/shadcn-suite.ts`
- Image auto-sanitizer → `src/inngest/utils.ts`
- Multi-model fallback (OpenAI + Gemini) → `src/lib/ai-provider.ts`
- Supabase 1-click schema sync → `src/modules/supabase/`

### Phase 2 — High Priority 🔴
1. **Supabase Live SQL Query Executor**: `src/app/api/supabase/query/route.ts` (directly port `api.supabase.query.ts`)
2. **1-Click Vercel Deploy**: `src/app/api/vercel-deploy/route.ts` + Deploy button in `project-header.tsx`
3. **1-Click Netlify Deploy**: `src/app/api/netlify-deploy/route.ts`
4. **Self-Healing Terminal Error Listener**: Parse E2B terminal stderr and feed errors back to AI for auto-fix.

### Phase 3 — Medium Priority 🟡
5. **AI ThoughtBox**: Parse `<thinking>` tags in messages, render as collapsible accordion in `message-card.tsx`
6. **MCP Server Config UI**: `MCPSettingsModal.tsx` + `src/app/api/mcp-check/route.ts`
7. **Starter Templates**: Add to home page, template cards that pre-fill prompts
8. **Design Theme Picker**: Color palette + font selector injected into AI system prompt
9. **Web Search API**: `src/app/api/web-search/route.ts` (port from `api.web-search.ts`)

### Phase 4 — Nice to Have 🟢
10. **Diff View**: Show file changes in a before/after view
11. **GitHub Import**: Clone any repo URL into E2B sandbox
12. **QR Code Preview**: Mobile preview via QR code
