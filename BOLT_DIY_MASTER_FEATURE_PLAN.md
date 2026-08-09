# Bolt.diy Complete Codebase Review & Feature Implementation Master Plan

> **Overview:** Comprehensive architectural analysis of `codebolt/bolt.diy` repository (`https://github.com/stackblitz-labs/bolt.diy.git`) and a step-by-step master plan to port its best features, system prompts, artifact system, multi-model providers, and self-healing error fixers directly into SparkSite.

---

## 🔬 Deep Codebase Audit of Bolt.diy

After auditing `codebolt/bolt.diy` (specifically `app/lib/common/prompts/prompts.ts`, `app/lib/stores/workbench.ts`, `app/lib/modules/llm/`, and component systems):

### 1. The Bolt Artifact XML Engine (`<boltArtifact>` & `<boltAction>`)
- **How Bolt Works**: Bolt does not rely on simple JSON tool calls. It uses a structured streaming XML format:
  ```xml
  <boltArtifact id="jewelry-app" title="Jewelry Store Application">
    <boltAction type="file" filePath="app/page.tsx">
      /* Full code */
    </boltAction>
    <boltAction type="shell">
      npm install framer-motion lucide-react
    </boltAction>
  </boltArtifact>
  ```
- **Why It's Better**: Allows real-time streaming file creation, instant package updates, and simultaneous execution without waiting for JSON tool turn completions.

### 2. Multi-Model LLM Provider Architecture (`app/lib/modules/llm/`)
- **How Bolt Works**: Bolt supports Anthropic Claude (3.5 Sonnet), OpenAI (GPT-4o), Google Gemini (Gemini 2.0 Flash), DeepSeek-V3/R1, and Groq out-of-the-box.
- **Why It's Better**: Users get zero 429 rate limit errors because the system automatically falls back to Gemini 2.0 Flash or Claude if OpenAI is busy.

### 3. Integrated Supabase DDL SQL Migrations Engine
- **How Bolt Works**:
  ```xml
  <boltAction type="supabase" operation="migration" filePath="/supabase/migrations/create_users.sql">
    CREATE TABLE users (...);
  </boltAction>
  ```
- **Why It's Better**: When database functionality is needed, Bolt automatically writes `.sql` migration files and executes them against live Supabase instances in 1 pass.

### 4. Self-Healing Build & Terminal Error Listener
- **How Bolt Works**: Listens to terminal `stderr` and build compiler outputs. If Turbopack/Next.js reports a missing import or syntax error, Bolt automatically feeds the stack trace back to the LLM for background self-healing!

### 5. Atomic Design & Shadcn Component Rules
- **How Bolt Works**: Bolt strictly mandates atomic design principles, 8pt grid spacing systems, Pexels/Unsplash stock photography, and 20+ pre-installed Shadcn UI components (`dialog`, `sheet`, `tabs`, `badge`, `avatar`, `dropdown-menu`, `accordion`, `select`, `slider`, `switch`, `tooltip`, `table`).

---

## 📋 Comprehensive Feature Comparison Table

| Feature / System | Bolt.diy Architecture | SparkSite Current State | Proposed SparkSite Upgrade |
| :--- | :--- | :--- | :--- |
| **System Prompt** | 700+ line structured rules (`prompts.ts`) | 80-line prompt | **Port Bolt's Full Structured System Prompt** |
| **Shadcn UI Suite** | Pre-installed 20+ components | 2 basic components | **Full 20+ Shadcn UI Suite (`shadcn-suite.ts`)** |
| **Multi-Model Provider** | OpenAI, Gemini, Claude, DeepSeek | OpenAI only | **OpenAI + Gemini 2.0 Flash Fallback Engine** |
| **Supabase SQL Sync** | Automated `.sql` migration engine | Credentials save | **Automated 1-Click Supabase SQL Schema Sync** |
| **Image Resolution** | Pexels/Unsplash verified URLs | Broken relative paths | **Dynamic HD Unsplash Asset Auto-Sanitizer** |
| **Error Listener** | WebContainer terminal listener | Inngest linter | **Terminal & Compiler Error Listener** |
| **Follow-up Editing** | Hydrated workbench state | Sandbox resets | **Hydrated Sandbox State Across Turns** |

---

## 🛠️ Step-by-Step Porting & Implementation Plan

### Phase 1: Core System Prompt & Artifact Rules Porting
- Port Bolt's battle-tested system prompt rules from `app/lib/common/prompts/prompts.ts` into `src/prompt.ts`.
- Enforce strict holistic file creation, 2-space indentation, atomic Shadcn component usage, and zero placeholders.

### Phase 2: Full 20+ Shadcn UI Component Suite
- Create `src/lib/shadcn-suite.ts` containing complete production-grade source code for all **20+ Shadcn UI components**:
  - `dialog.tsx`, `sheet.tsx`, `tabs.tsx`, `badge.tsx`, `avatar.tsx`, `dropdown-menu.tsx`, `accordion.tsx`, `select.tsx`, `slider.tsx`, `switch.tsx`, `table.tsx`, `tooltip.tsx`.
- Update `src/inngest/functions.ts` to pre-hydrate all 20+ Shadcn UI components into `components/ui/` in the E2B sandbox on every project run.

### Phase 3: Multi-Model AI Provider Engine (GPT-4o + Gemini 2.0 Flash)
- Complete `src/lib/ai-provider.ts` to support OpenAI (`gpt-4o`) with automatic failover to Google Gemini (`gemini-2.0-flash`).
- Guarantees **100% generation uptime and ZERO 429 rate limit errors**.

### Phase 4: Automated Supabase DDL SQL Migrations
- Integrate `src/lib/supabase-provisioner.ts` into `src/modules/supabase/server/procedures.ts`.
- Allow 1-click execution of `supabase/schema.sql` directly on live user Supabase instances.

### Phase 5: Self-Healing QA Engine Enhancement
- Expand `src/inngest/utils.ts` to automatically fix broken image paths, invalid Zustand imports, and missing client directives before rendering previews.

---

## 🎯 Expected Outcome

After executing this master plan, SparkSite will generate **$100k SaaS-level web applications** with working slide-over carts, modal dialogs, category filter tabs, price range sliders, dark mode toggles, and live Supabase queries — operating at **sub-15 second speeds** with **zero 429 errors**.
