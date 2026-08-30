# Vibel — Multi-Agent Autonomous Website Generation Architecture

## 1. Executive Summary & Vision

Vibel transitions from a single-pass, monolithic code generation agent to an **Autonomous Multi-Agent Engineering Organization** powered by **TypeScript + LangGraph.js**.

Instead of dumping prompts into a single model call and hoping for a working full-stack application, Vibel orchestrates specialized agents across a stateful cyclic directed graph (StateGraph):
```
UNDERSTAND ➔ PLAN ➔ DETECT CAPABILITIES ➔ RESEARCH + DESIGN (Parallel) ➔ ARCHITECT ➔ IMPLEMENT ➔ EXECUTE IN SANDBOX ➔ BROWSER INSPECTION (Playwright) ➔ JUDGE ➔ TARGETED FIX LOOP ➔ FINAL APPLICATION
```

---

## 2. Core Architecture & Workflow Graph

```
                           ┌───────────────────────────┐
                           │        User Prompt        │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │      1. Orchestrator      │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │    2. Product Planner     │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │   3. Capability Planner   │
                           └─────────────┬─────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              ▼                          ▼                          ▼
   ┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
   │  4. Design Agent   │     │ 5. Research Agent  │     │ 6. Content Agent   │
   │ (Tokens/Layout/UX) │     │ (Docs/APIs/Assets) │     │ (Copy/Data/SEO)    │
   └──────────┬─────────┘     └──────────┬─────────┘     └──────────┬─────────┘
              └──────────────────────────┼──────────────────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │   7. Architecture Agent   │
                           │(File Tree/Schema/Contracts│
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │ 8. Implementation Agent   │
                           │  (Tool-Driven Code Gen)   │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │  9. E2B Sandbox Runtime   │
                           │ (Next.js Dev Server/Build)│
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │10. Browser/Playwright QA  │
                           │(Screenshots/Console/DOM)  │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │  11. Website Judge Agent  │
                           │ (Quality Score >= 8.5/10) │
                           └─────────────┬─────────────┘
                                         │
                       ┌─────────────────┴─────────────────┐
                       │                                   │
              [Score < 8.5 & iter < max]             [Score >= 8.5]
                       │                                   │
                       ▼                                   ▼
            ┌─────────────────────┐             ┌─────────────────────┐
            │   12. Fix Agent     │             │ 13. Complete Output │
            │ (Targeted Patches)  │             │ (DB Save & Preview) │
            └──────────┬──────────┘             └─────────────────────┘
                       │
                       └───────────────► (Re-apply to Sandbox & Loop)
```

---

## 3. Agents & Roles Specification

### 1. Orchestrator & State Manager
- **Role**: Coordinates node execution, state hydration/persistence, checkpointing, and conditional transitions.
- **Routing**: Resolves node branches, tracks iteration count ($0 \le \text{iter} \le 3$), and initiates rollback or human intervention if needed.

### 2. Product Planner Agent
- **Model**: Reasoning-heavy (`gpt-4o` or o1/o3-mini).
- **Input**: Raw natural language prompt and optional image reference.
- **Output**: Structured `ProductSpec` (product type, target users, routes, features, interactive user flows, entity requirements).

### 3. Capability Planner Agent
- **Model**: Deterministic / Structured JSON (`gpt-4o-mini` or `gpt-4o`).
- **Input**: `ProductSpec`.
- **Output**: `CapabilityManifest` (dynamic flags for `frontend`, `backend`, `database`, `auth`, `payments`, `storage`, `charts`, `ai`, `seo`, etc.). Only activate necessary sub-modules and tools.

### 4. Design Agent
- **Model**: Vision/Design (`gpt-4o`).
- **Input**: `ProductSpec`, `CapabilityManifest`, prebuilt glassmorphism design tokens.
- **Output**: `DesignSystem` (theme, color palette tokens, typography scale, spacing tokens, component specs, micro-interactions, responsive breakpoints).

### 5. Research & Resource Agent
- **Model**: Structured query planner (`gpt-4o-mini`).
- **Input**: `ProductSpec`, `CapabilityManifest`.
- **Output**: `ResourceManifest` (verified Unsplash stock photography CDN URLs, verified Lucide icon map, official documentation snippets for Supabase/Stripe/Tailwind, mock data seed).

### 6. Architecture Agent
- **Model**: Reasoning (`gpt-4o`).
- **Input**: `ProductSpec` + `DesignSystem` + `ResourceManifest` + `CapabilityManifest`.
- **Output**: `ArchitecturePlan` (complete file tree mapping, database schema SQL/Prisma, API route contracts, client component boundaries `"use client"`, state management stores).

### 7. Implementation Agent
- **Model**: High-performance Coding (`gpt-4o`).
- **Tools**:
  - `writeFile(path, content)`
  - `modifyFile(path, patch)`
  - `readFile(path)`
  - `runCommand(command)` (Terminal)
  - `mcpSupabase(action, params)`
- **Behavior**: Executes code construction in batches, imports verified components from Shadcn UI & prebuilt blocks, integrates Supabase clients when activated.

### 8. Sandbox & Browser Observation Runtime
- **Runtime**: E2B Cloud Sandbox (`viber-nextjs`) + Playwright Headless Driver.
- **Actions**:
  1. Boot Next.js dev server on port 3000.
  2. Capture multi-viewport screenshots: Mobile (`375px`), Tablet (`768px`), Desktop (`1440px`).
  3. Extract browser console errors, unhandled rejections, and failed network requests.
  4. Perform sanity click tests on interactive elements (buttons, dialogs, drawers).

### 9. Website Judge Agent
- **Model**: Multimodal Vision (`gpt-4o`).
- **Input**: Multi-viewport screenshots, console logs, build outputs, and `ProductSpec`.
- **Scoring Dimensions**:
  - Visual Quality (1–10)
  - UX & Micro-interactions (1–10)
  - Mobile & Responsive Layout (1–10)
  - Functional Correctness (1–10)
  - Code & Technical Quality (1–10)
- **Output**: `overall_score` (0.0 – 10.0), `passed` (boolean, $\ge 8.5$), and granular `issues[]` array.

### 10. Fix Agent
- **Model**: Precision Coding (`gpt-4o`).
- **Input**: Current project files, Judge `issues[]`, and browser screenshots.
- **Output**: Targeted file patches for the Implementation Agent to apply (avoiding destructive full regenerations).

---

## 4. LangGraph State Schema (`WebsiteStateAnnotation`)

```typescript
import { Annotation } from "@langchain/langgraph";

export interface ProductSpec {
  productType: string;
  title: string;
  targetAudience: string[];
  pages: string[];
  features: string[];
  userFlows: string[];
}

export interface CapabilityManifest {
  frontend: boolean;
  backend: boolean;
  database: boolean;
  authentication: boolean;
  payments: boolean;
  storage: boolean;
  charts: boolean;
  aiIntegration: boolean;
  seo: boolean;
}

export interface DesignSystem {
  theme: "dark" | "light" | "system";
  style: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    accent: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    headingScale: string;
  };
  tokens: Record<string, string>;
}

export interface ResourceManifest {
  images: Array<{ key: string; url: string; alt: string }>;
  icons: string[];
  docNotes: string[];
  mockData: Record<string, any>;
}

export interface ArchitecturePlan {
  fileTree: string[];
  schemaSql?: string;
  componentContracts: Array<{ path: string; isClient: boolean; exports: string[] }>;
  stateManagement: string;
}

export interface QAFeedback {
  overallScore: number;
  visualScore: number;
  uxScore: number;
  responsiveScore: number;
  functionalScore: number;
  technicalScore: number;
  passed: boolean;
  issues: Array<{
    severity: "low" | "medium" | "high" | "critical";
    component: string;
    description: string;
    suggestedFix: string;
  }>;
}

export const WebsiteStateAnnotation = Annotation.Root({
  projectId: Annotation<string>,
  prompt: Annotation<string>,
  imageUrl: Annotation<string | undefined>,
  mode: Annotation<"BUILD" | "DISCUSS">,
  
  // Agent Artifacts
  productSpec: Annotation<ProductSpec>,
  capabilities: Annotation<CapabilityManifest>,
  designSystem: Annotation<DesignSystem>,
  resources: Annotation<ResourceManifest>,
  architecture: Annotation<ArchitecturePlan>,
  
  // Filesystem & Runtime State
  files: Annotation<Record<string, string>>,
  sandboxId: Annotation<string>,
  sandboxUrl: Annotation<string>,
  
  // QA & Evaluation
  screenshots: Annotation<Array<{ viewport: string; base64OrUrl: string }>>,
  consoleErrors: Annotation<string[]>,
  qaReport: Annotation<QAFeedback>,
  
  // Iteration Tracking
  iteration: Annotation<number>,
  maxIterations: Annotation<number>,
  summary: Annotation<string>,
  title: Annotation<string>,
});
```

---

## 5. Directory & File Organization

The new multi-agent engine is encapsulated cleanly in `src/lib/agents/`:

```text
src/
├── lib/
│   ├── agents/
│   │   ├── state.ts                  # LangGraph State & Type Annotations
│   │   ├── graph.ts                  # LangGraph StateGraph builder, nodes & conditional edges
│   │   ├── nodes/
│   │   │   ├── product-planner.ts    # Agent 2: Product spec generator
│   │   │   ├── capability-planner.ts # Agent 3: Dynamic capability activator
│   │   │   ├── design-agent.ts       # Agent 4: Design tokens & layout architect
│   │   │   ├── research-agent.ts     # Agent 5: Assets, verified Unsplash CDN & docs
│   │   │   ├── architect-agent.ts    # Agent 6: File tree & schema designer
│   │   │   ├── implementation.ts     # Agent 7: Sandbox code writer & package installer
│   │   │   ├── browser-runner.ts     # Step 8: Playwright / E2B browser test & screenshots
│   │   │   ├── website-judge.ts      # Agent 9: Multimodal evaluation & scoring
│   │   │   └── fix-agent.ts          # Agent 10: Targeted fix planner
│   │   ├── tools/
│   │   │   ├── filesystem-tools.ts   # E2B Sandbox read/write/modify tools
│   │   │   ├── terminal-tools.ts     # E2B command runner & auto-installer
│   │   │   └── mcp-supabase-tools.ts # Supabase schema & DDL execution
│   │   └── prompts/
│   │       ├── system-prompts.ts     # Prompt engineering for all agents
│   │       └── design-tokens.ts      # Glassmorphism & UI design guidelines
├── inngest/
│   ├── functions.ts                  # Inngest function invoking LangGraph engine
│   └── utils.ts                      # E2B client helpers & progress reporters
```

---

## 6. Frontend Progress Synchronization

The UI (`src/modules/projects/ui/components/message-loading.tsx`) dynamically mirrors each stage of the multi-agent graph:

| Stage | Progress Step Label | Icon / State |
| :--- | :--- | :--- |
| **1. Init** | `Setting up sandbox...` | Sandbox Provisioning |
| **2. Spec** | `Understanding requirements & planning...` | Product Planner |
| **3. Parallel** | `Designing interface & gathering assets...` | Design + Research Agents |
| **4. Architect** | `Architecting full-stack structure...` | Architecture Agent |
| **5. Build** | `Writing code & installing dependencies...` | Implementation Agent |
| **6. Browser QA**| `Running browser tests & visual inspection...` | Playwright Browser Runner |
| **7. Judge** | `Evaluating quality & UX score (Target >= 8.5)...`| Website Judge |
| **8. Fix (if needed)**| `Refining UI & applying targeted fixes...` | Fix Agent Loop |
| **9. Complete**| `Finalizing app preview...` | Save & Preview Ready |
