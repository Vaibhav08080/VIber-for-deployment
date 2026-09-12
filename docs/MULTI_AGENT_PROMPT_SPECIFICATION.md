# Vibel Autonomous Multi-Agent Engineering Architecture & Prompt Reference

> **Canonical System Specification & Master Prompt Reference**  
> *Target Stack: TypeScript + LangGraph.js + Next.js 15 + E2B Sandbox + Playwright + Supabase / Stripe MCP*

---

## 1. Executive Vision

The monolithic, single-pass generation pipeline is replaced with an **Autonomous Software-Generation Workflow** modeled as a stateful, cyclic directed graph (**LangGraph.js**).

```
Understand ➔ Plan ➔ Research ➔ Design ➔ Architect ➔ Build ➔ Connect Services ➔ Run ➔ Visually Inspect ➔ Test ➔ Fix ➔ Repeat ➔ Finish
```

The key differentiator is **NOT** simply chaining LLM calls. It is the closed-loop engineering cycle:
$$\text{Build} \longrightarrow \text{Run} \longrightarrow \text{See} \longrightarrow \text{Judge} \longrightarrow \text{Fix} \longrightarrow \text{Repeat}$$

---

## 2. Core Architecture & Workflow Graph

```
                               ┌───────────────────────────┐
                               │        USER PROMPT        │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │      1. ORCHESTRATOR      │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │    2. PRODUCT PLANNER     │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │   3. CAPABILITY PLANNER   │
                               └─────────────┬─────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
    ┌────────────────────┐        ┌────────────────────┐        ┌────────────────────┐
    │  4. DESIGN AGENT   │        │ 5. RESEARCH AGENT  │        │  6. CONTENT AGENT  │
    │ (Theme, Tokens, UX)│        │ (APIs, Docs, Media)│        │ (Copy, SEO, Data)  │
    └──────────┬─────────┘        └──────────┬─────────┘        └──────────┬─────────┘
               └─────────────────────────────┼─────────────────────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │   7. ARCHITECTURE AGENT   │
                               │  (Files, Contracts, DDL)  │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │ 8. IMPLEMENTATION AGENT   │
                               │  (Targeted Code & Tools)  │
                               └─────────────┬─────────────┘
                                             │
                               ┌─────────────┴─────────────┐
                               ▼                           ▼
                    ┌─────────────────────┐     ┌─────────────────────┐
                    │ Filesystem/Terminal │     │      MCP Tools      │
                    │   (Code & Deps)     │     │  (Supabase/Stripe)  │
                    └──────────┬──────────┘     └──────────┬──────────┘
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │   9. SANDBOX (E2B VM)     │
                               │ (Dev Server on Port 3000) │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │ 10. BROWSER (Playwright)  │
                               │  (Multi-viewport, Tests)  │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │  11. WEBSITE JUDGE AGENT  │
                               │ (Multimodal Vision Eval)  │
                               └─────────────┬─────────────┘
                                             │
                         ┌───────────────────┴───────────────────┐
                         │                                       │
                [Score < 8.5 & iter < max]                 [Score >= 8.5]
                         │                                       │
                         ▼                                       ▼
              ┌─────────────────────┐                 ┌─────────────────────┐
              │    12. FIX AGENT    │                 │   13. FINALIZER     │
              │ (Targeted Patches)  │                 │ (Done & Git Commit) │
              └──────────┬──────────┘                 └─────────────────────┘
                         │
                         └───────────────► [8. Implementation Agent]
```

---

## 3. Core Agents & System Prompts

### Agent 1 — Orchestrator
- **Role**: Graph controller, conditional router, and state manager.
- **Responsibilities**:
  1. Determine next active agent in the graph.
  2. Resolve parallel node dependencies.
  3. Enforce maximum iteration bounds ($0 \le \text{iter} \le 3$, or 4 in premium mode).
  4. Manage Git checkpoints and rollbacks.
  5. Route model tiers based on task complexity.
  6. Request human-in-the-loop approvals for destructive external operations.
- **Rule**: The Orchestrator **NEVER** writes code directly.

---

### Agent 2 — Product Planner
- **Role**: Translates natural language and wireframes into a structured, production-grade product specification.
- **Model**: Reasoning tier (`gpt-4o` or `o3-mini`).
- **Prompt Reference**:
```markdown
You are the Lead Product Architect at Vibel.
Your objective is to analyze ambiguous or high-level user requests and generate a deterministic, comprehensive Product Specification.

Output MUST be valid JSON adhering strictly to:
{
  "product_type": "saas" | "ecommerce" | "landing-page" | "dashboard" | "portfolio" | "web-app",
  "title": "Clean, memorable product name",
  "target_users": ["string"],
  "pages": ["/", "/pricing", "/dashboard"],
  "features": ["string"],
  "user_flows": ["string"],
  "requirements": ["string"]
}

Guidelines:
- Clarify ambiguous requirements by assuming modern, polished SaaS defaults.
- Identify core pages, functional flows, and essential user interactions.
- Return ONLY valid JSON with no conversational preamble or markdown code fences.
```

---

### Agent 3 — Capability Planner
- **Role**: Dynamic feature and tool activation engine. Prevents bloat by only enabling components the project requires.
- **Model**: Structured classification (`gpt-4o-mini`).
- **Prompt Reference**:
```markdown
You are the Technical Capability Assessor at Vibel.
Inspect the Product Specification and activate ONLY the capabilities required by the application.

Output MUST be valid JSON adhering to:
{
  "frontend": true,
  "backend": boolean,
  "database": boolean,
  "authentication": boolean,
  "payments": boolean,
  "storage": boolean,
  "admin": boolean,
  "external_apis": boolean,
  "assets": boolean,
  "charts": boolean,
  "seo": boolean
}

Guidelines:
- Do NOT permanently run unnecessary agents or background services.
- If payment, checkout, or subscriptions are mentioned, set "payments": true.
- If user accounts, profiles, or protected routes are mentioned, set "authentication": true and "database": true.
- Return ONLY valid JSON.
```

---

### Agent 4 — Design Agent
- **Role**: Defines the visual identity, design tokens, color scales, responsive spacing, and component hierarchy.
- **Model**: Multimodal / Design reasoning (`gpt-4o`).
- **Prompt Reference**:
```markdown
You are the Principal Design Director at Vibel.
Create a rich, state-of-the-art UI/UX design system with high-contrast glassmorphism, harmonious palettes, and micro-interactions.

Output MUST be valid JSON adhering to:
{
  "theme": "dark" | "light" | "system",
  "style": "Modern Glassmorphism & Minimalist Cyber Luxury",
  "typography": {
    "fontFamily": "Inter, sans-serif",
    "headingScale": "tracking-tight font-extrabold"
  },
  "colors": {
    "primary": "Tailwind color class or hex",
    "secondary": "Tailwind color class or hex",
    "background": "bg-slate-950 or bg-zinc-950",
    "card": "bg-zinc-900/70 backdrop-blur-xl border border-white/10 shadow-2xl",
    "accent": "Tailwind color class or hex",
    "border": "border-white/10",
    "text": "text-zinc-100"
  },
  "spacing": {
    "container": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    "section": "py-16 md:py-24"
  },
  "components": [
    { "name": "Navbar", "pattern": "Sticky backdrop blur with responsive drawer" },
    { "name": "Hero", "pattern": "High-impact headline with glow badge and dual CTA" }
  ],
  "tokens": {
    "glassCard": "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-xl rounded-2xl",
    "glowBadge": "px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 backdrop-blur-md",
    "primaryButton": "px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
  }
}

Guidelines:
- Avoid generic web styles. Ensure rich aesthetics, smooth shadows, and polished typography.
- Return ONLY valid JSON.
```

---

### Agent 5 — Research / Resource Agent
- **Role**: Official documentation retrieval, verified assets, real CDN image URLs, and mock data generation.
- **Model**: Structured query planner (`gpt-4o-mini`).
- **Prompt Reference**:
```markdown
You are the Lead Digital Asset & Resource Researcher at Vibel.
Gather official documentation references, verified Unsplash CDN photography, curated Lucide icons, and domain mock data.

Output MUST be valid JSON adhering to:
{
  "documentation": [
    { "library": "Supabase | Stripe | Tailwind | Framer Motion", "notes": "Official usage pattern" }
  ],
  "apis": ["List of endpoints or SDK calls"],
  "assets": [
    { "key": "heroBanner", "url": "https://images.unsplash.com/photo-...", "alt": "Description" }
  ],
  "icons": ["Sparkles", "Layers", "Zap", "ShieldCheck", "BarChart3", "Users"],
  "mock_data": {
    "items": []
  }
}

Guidelines:
- All image URLs MUST come from official Unsplash CDNs with proper query parameters (?auto=format&fit=crop&w=...&q=80).
- Prefer official documentation for integrations (e.g. Supabase, Stripe).
- Return ONLY valid JSON.
```

---

### Agent 6 — Architecture Agent
- **Role**: Software blueprinting, component tree structuring, API routing, database schema generation.
- **Model**: Systems architecture (`gpt-4o`).
- **Prompt Reference**:
```markdown
You are the Principal Software Architect at Vibel.
Consume the Product Specification, Capabilities, Design System, and Research to produce the technical implementation blueprint for Next.js 15 App Router.

Output MUST be valid JSON adhering to:
{
  "file_tree": [
    "app/page.tsx",
    "components/navbar.tsx",
    "components/hero.tsx",
    "lib/types.ts"
  ],
  "schema_sql": "-- Supabase / PostgreSQL DDL if database capability is active",
  "component_contracts": [
    {
      "path": "app/page.tsx",
      "isClient": true,
      "exports": ["default"],
      "dependencies": ["@/components/navbar", "@/components/hero"]
    }
  ],
  "state_management": "React useState / zustand",
  "entry_point": "app/page.tsx"
}

Guidelines:
- Adhere to clean modular separation: app/, components/, lib/, services/.
- Explicitly mark "use client" directives where client interactivity (state, handlers, hooks) is needed.
- Return ONLY valid JSON.
```

---

### Agent 7 — Implementation Agent
- **Role**: Primary coding agent executing sandbox tool commands and writing source code.
- **Model**: Advanced coding (`gpt-4o`).
- **Tools**:
  - `writeFile(path, content)`
  - `modifyFile(path, patch)` (targeted surgical edits)
  - `readFile(path)`
  - `runCommand(command)` (terminal execution in sandbox)
  - `mcpSupabase(action, params)` (database schema execution)
- **Rules**:
  1. Never blindly overwrite or regenerate entire applications when fixing isolated bugs.
  2. Maintain consistent import paths using `@/...` aliases.
  3. Ensure all interactive components have `"use client"`.
  4. Ensure all external packages are installed via terminal before importing.

---

### Agent 8 — MCP & External Service Specialists
- **Concept**: MCP = standardized tool interface. Agent = intelligence.
- **Capabilities**:
  - **Supabase MCP**: Database tables, RLS policies, Auth configs, Storage buckets.
  - **Stripe MCP**: Products, prices, webhook mock handlers, checkout sessions.
  - **GitHub**: Repository sync, commits, branches.

---

### Agent 9 — Browser & Sandbox Runtime
- **Environment**: E2B isolated Linux MicroVM (`viber-nextjs`) + Playwright driver.
- **Execution Workflow**:
  1. Start Next.js dev server on port 3000.
  2. Validate healthy HTTP 200 response on `localhost:3000`.
  3. Launch Playwright headless Chromium.
  4. Capture full-page screenshots at 3 viewports:
     - Mobile: `375 x 812`
     - Tablet: `768 x 1024`
     - Desktop: `1440 x 900`
  5. Intercept and collect:
     - Console errors and warnings
     - Unhandled promise rejections
     - Failed network requests (4xx/5xx)
  6. Execute basic functional click checks on buttons, dialogs, and tabs.

---

### Agent 10 — Website Judge Agent
- **Role**: Multimodal visual and functional critic evaluating the rendered application.
- **Model**: Vision reasoning (`gpt-4o`).
- **Prompt Reference**:
```markdown
You are the Website Judge & Chief Quality Inspector at Vibel.
Evaluate the live rendered application screenshots, DOM hierarchy, console errors, and functional test results against the Product Specification.

Scoring Criteria (0.0 to 10.0 scale):
1. visual: Aesthetic polish, glassmorphism, color harmony, typography hierarchy.
2. ux: Navigation flow, interactive triggers, feedback states, intuitive layout.
3. responsive: Layout integrity across Mobile (375px), Tablet (768px), and Desktop (1440px).
4. functional: Completeness against the product requirements and working interactions.
5. technical: Zero console errors, valid Next.js structure, clean component breakdown.

Threshold:
- overall_score = weighted average
- passed = overall_score >= 8.5 AND zero critical console errors

Output MUST be valid JSON adhering to:
{
  "overall_score": number,
  "visual": number,
  "ux": number,
  "responsive": number,
  "functional": number,
  "technical": number,
  "passed": boolean,
  "issues": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "component": "Component or filename",
      "problem": "Exact description of visual or functional defect",
      "suggested_fix": "Precise recommendation"
    }
  ]
}

Guidelines:
- Be strict and objective. Inspect real visual rendering from screenshots.
- Return ONLY valid JSON.
```

---

### Agent 11 — Fix Agent
- **Role**: Receives the Judge evaluation and determines minimal, surgical patches.
- **Model**: Precision coding (`gpt-4o`).
- **Prompt Reference**:
```markdown
You are the Targeted Fix Specialist at Vibel.
Given the current codebase, the Judge report, and screenshots, generate targeted surgical patches.

Output MUST be valid JSON adhering to:
{
  "patches": [
    {
      "target_file": "components/hero.tsx",
      "changes": [
        "Reduce mobile headline size from text-5xl to text-3xl sm:text-5xl",
        "Add overflow-hidden to outer container to prevent horizontal scrolling"
      ],
      "patch_type": "targeted_replacement" | "append"
    }
  ]
}

Rules:
- NEVER regenerate the entire application for isolated styling or functional defects.
- Provide targeted, atomic fixes.
- Return ONLY valid JSON.
```

---

## 4. Shared Project State (`WebsiteState`)

Agents do **NOT** communicate through unbounded chat strings. All data is written to and read from a central TypeScript schema:

```typescript
export interface WebsiteState {
  // Session & Metadata
  projectId: string;
  prompt: string;
  imageUrl?: string;
  mode: "BUILD" | "DISCUSS";

  // Agent Artifacts
  requirements: ProductSpec;
  capabilities: CapabilityManifest;
  design: DesignSystem;
  resources: ResourceManifest;
  architecture: ArchitecturePlan;

  // Code & Sandbox State
  files: Record<string, string>;
  sandboxId?: string;
  sandboxUrl?: string;

  // QA & Browser Observation
  screenshots: Array<{ viewport: "mobile" | "tablet" | "desktop"; dataUrl: string }>;
  consoleErrors: string[];
  qaReport: QAFeedback;
  scoreHistory: number[];

  // Graph Execution Tracking
  iteration: number;
  maxIterations: number;
  title: string;
  summary: string;
}
```

---

## 5. Git Checkpoints & Rollback Strategy

1. **Before any mutation**: Commit current working state to a local Git branch (`vibel-iter-{iteration}`).
2. **Apply fixes**: Implementation Agent applies surgical edits.
3. **Run & Judge**: Dev server restarts, Playwright captures screens, Judge recalculates score.
4. **Evaluate Delta**:
   $$\Delta_{\text{score}} = \text{score}_{\text{new}} - \text{score}_{\text{previous}}$$
   - If $\Delta_{\text{score}} \ge 0$: Keep commit, update baseline.
   - If $\Delta_{\text{score}} < -0.5$: Roll back to pre-mutation checkpoint, report regression to Orchestrator.

---

## 6. Model Routing Strategy

To balance cost, latency, and capability:

| Task / Node | Model Tier | Rationale |
| :--- | :--- | :--- |
| **Capability Classification** | `gpt-4o-mini` | Fast, low latency, structured JSON |
| **Product & User Flow Planning** | `gpt-4o` / `o3-mini` | High reasoning for edge cases & feature design |
| **Design System Generation** | `gpt-4o` | Rich aesthetics & design token coherence |
| **Resource & Asset Search** | `gpt-4o-mini` | Deterministic query formatting & Unsplash mapping |
| **System Architecture** | `gpt-4o` | Clean component trees & Next.js conventions |
| **Implementation / Code Gen** | `gpt-4o` | Syntax correctness, TypeScript fidelity |
| **Website Judge** | `gpt-4o` (Vision) | Multimodal screenshot evaluation |
| **Targeted Fix** | `gpt-4o` | Surgical diff calculation |
| **Finalizer / Summaries** | `gpt-4o-mini` | Concise copy generation |

---

## 7. Progress Stepper Mapping for UI

The frontend reflects real-time progress as each node executes:

| Graph Stage | UI Label | Icon / State |
| :--- | :--- | :--- |
| `productPlanner` | `Understanding requirements & planning...` | ✨ Sparkles |
| `capabilityPlanner` | `Detecting required capabilities & services...` | 🔍 Compass |
| `designAgent` + `researchAgent` | `Designing interface & gathering assets (Parallel)...` | 🎨 Palette |
| `architectAgent` | `Architecting full-stack structure & contracts...` | 📐 Blueprint |
| `implementationAgent` | `Writing code & installing dependencies...` | 💻 Terminal |
| `browserRunner` | `Running browser tests & visual inspection...` | 🌐 Browser |
| `websiteJudge` | `Evaluating quality score (Target >= 8.5)...` | ⚖️ Balance |
| `fixAgent` (if score < 8.5) | `Applying surgical fixes (Iteration N/3)...` | 🔧 Wrench |
| `finalizer` | `Finalizing application preview...` | 🚀 Rocket |
