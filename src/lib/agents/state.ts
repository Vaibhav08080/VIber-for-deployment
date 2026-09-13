import { Annotation } from "@langchain/langgraph";

export interface ProductSpec {
  productType: string;
  title: string;
  targetAudience: string[];
  pages: string[];
  features: string[];
  userFlows: string[];
  keyComponents: string[];
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
    text: string;
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

export interface ContentPackage {
  brandName: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  ctaText: string;
  featureHeadlines: Array<{ title: string; description: string }>;
  testimonialQuotes: Array<{ author: string; role: string; text: string; rating: number }>;
  faqItems: Array<{ question: string; answer: string }>;
  seoMeta: { title: string; description: string };
}

export interface ArchitecturePlan {
  fileTree: string[];
  schemaSql?: string;
  componentContracts: Array<{ path: string; isClient: boolean; description: string }>;
  stateManagement: string;
  entryPoint: string;
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

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

export interface CapabilityChoices {
  authentication: boolean;
  database: boolean;
  storage: boolean;
  payments: boolean;
  aiFeatures: boolean;
  backendRequired: boolean;
}

export const WebsiteStateAnnotation = Annotation.Root({
  projectId: Annotation<string>,
  prompt: Annotation<string>,
  imageUrl: Annotation<string | undefined>,
  mode: Annotation<"BUILD" | "DISCUSS">,
  supabaseUrl: Annotation<string | undefined>,
  supabaseAnonKey: Annotation<string | undefined>,

  // Intent detection: determines pipeline routing
  intent: Annotation<"new_project" | "edit_request">({
    reducer: (_, update) => update ?? "new_project",
    default: () => "new_project",
  }),

  // Last N messages from the conversation (for edit context)
  conversationHistory: Annotation<ConversationMessage[]>({
    reducer: (_, update) => update ?? [],
    default: () => [],
  }),

  // User's declared backend needs (from capability wizard or AI detection)
  capabilityChoices: Annotation<CapabilityChoices | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),
  
  // Agent Artifacts
  productSpec: Annotation<ProductSpec>,
  capabilities: Annotation<CapabilityManifest>,
  designSystem: Annotation<DesignSystem>,
  resources: Annotation<ResourceManifest>,
  content: Annotation<ContentPackage>,
  architecture: Annotation<ArchitecturePlan>,
  
  // Sandbox & Filesystem State
  files: Annotation<Record<string, string>>({
    reducer: (curr, update) => ({ ...curr, ...update }),
    default: () => ({}),
  }),
  sandboxId: Annotation<string>,
  sandboxUrl: Annotation<string>,
  
  // Browser Inspection & QA
  screenshots: Annotation<Array<{ viewport: string; dataUrl: string }>>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  consoleErrors: Annotation<string[]>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
  qaReport: Annotation<QAFeedback>,
  scoreHistory: Annotation<number[]>({
    reducer: (curr, update) => (update ? [...curr, ...update] : curr),
    default: () => [],
  }),
  previousFiles: Annotation<Record<string, string> | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),
  previousScore: Annotation<number | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),
  gitCheckpoint: Annotation<string | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),
  
  // Iteration & Output
  iteration: Annotation<number>({
    reducer: (curr, update) => (update !== undefined ? update : curr + 1),
    default: () => 0,
  }),
  maxIterations: Annotation<number>({
    reducer: (_, update) => update ?? 3,
    default: () => 3,
  }),
  summary: Annotation<string>,
  title: Annotation<string>,
});

export type WebsiteState = typeof WebsiteStateAnnotation.State;
