import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, sanitizeClientComponents } from "./utils";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { pushFilesToGitHubRepo } from "@/lib/github";
import { clerkClient } from "@clerk/nextjs/server";
import { SHADCN_UI_FILES } from "@/lib/shadcn-suite";
import { runWebsiteGenerationGraph } from "@/lib/agents/graph";
import { reportProgress } from "@/lib/agents/utils";

async function cleanupProgress(projectId: string) {
  try {
    await prisma.progressStep.updateMany({
      where: { projectId, status: "RUNNING" },
      data: { status: "DONE" },
    });
  } catch (err) {
    // Non-blocking cleanup
  }
}

export const CodeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {

    // --- DISCUSS Mode: Fast advisory without container modifications ---
    if (event.data.mode === "DISCUSS") {
      const content = await step.run("generate-discuss-response", async () => {
        const messages = await prisma.message.findMany({
          where: { projectId: event.data.projectId },
          orderBy: { createdAt: "asc" },
        });

        const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          {
            role: "system",
            content: `You are an expert AI software architect and senior product designer for Vibel.
The user is in DISCUSS mode. They want to ask questions, discuss design ideas, plan features, or troubleshoot without modifying any code files or sandboxes right now.
Provide clear, structured, technical, and helpful answers. Use bullet points and code snippets where helpful. Keep your response focused on answering their question directly.`,
          },
        ];

        for (const message of messages) {
          if (message.role === "ASSISTANT") {
            formattedMessages.push({
              role: "assistant",
              content: message.content,
            });
          } else {
            if (message.imageUrl) {
              formattedMessages.push({
                role: "user",
                content: [
                  { type: "text", text: message.content },
                  { type: "image_url", image_url: { url: message.imageUrl } },
                ],
              });
            } else {
              formattedMessages.push({
                role: "user",
                content: message.content,
              });
            }
          }
        }

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await client.chat.completions.create({
          model: "gpt-4o",
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 2000,
        });

        return response.choices[0]?.message?.content || "Here is my advice on your project.";
      });

      await step.run("save-discuss-message", async () => {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: content,
            role: "ASSISTANT",
            type: "RESULT",
            mode: "DISCUSS",
          },
        });
      });

      return {
        summary: content,
        mode: "DISCUSS",
      };
    }

    // --- 1. Provision E2B Sandbox ---
    const SandboxId = await step.run("get-sandbox-id", async () => {
      await reportProgress(event.data.projectId, "Setting up sandbox...", "RUNNING");
      const sandbox = await Sandbox.create("viber-nextjs", {
        timeoutMs: 60 * 60 * 1000,
      });
      await reportProgress(event.data.projectId, "Setting up sandbox...", "DONE");
      return sandbox.sandboxId;
    });

    // --- 2. Hydrate Existing Project Files ---
    const existingFiles = await step.run("get-existing-files", async () => {
      const lastFragment = await prisma.fragment.findFirst({
        where: {
          message: {
            projectId: event.data.projectId,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!lastFragment?.files) return {};
      return lastFragment.files as Record<string, string>;
    });

    await step.run("hydrate-sandbox-files", async () => {
      const sandbox = await getSandbox(SandboxId);
      const allFilesToHydrate = { ...SHADCN_UI_FILES, ...existingFiles };
      const sanitized = sanitizeClientComponents(allFilesToHydrate);
      await Promise.all(
        Object.entries(sanitized).map(async ([path, content]) => {
          await sandbox.files.write(path, content);
        })
      );
    });

    // --- 3. Get Project Integrations (Supabase / GitHub) ---
    const projectDb = await step.run("get-project-details", async () => {
      return await prisma.project.findUnique({
        where: { id: event.data.projectId },
        select: { supabaseUrl: true, supabaseAnonKey: true },
      });
    });

    // --- 4. Execute LangGraph Stateful Multi-Agent Pipeline ---
    const agentResult = await step.run("run-langgraph-multi-agent", async () => {
      return await runWebsiteGenerationGraph({
        projectId: event.data.projectId,
        prompt: event.data.value,
        imageUrl: event.data.imageUrl,
        mode: event.data.mode || "BUILD",
        supabaseUrl: projectDb?.supabaseUrl || undefined,
        supabaseAnonKey: projectDb?.supabaseAnonKey || undefined,
        sandboxId: SandboxId,
        initialFiles: existingFiles,
      });
    });

    // --- 5. Determine Sandbox Preview Host ---
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      await reportProgress(event.data.projectId, "Building your app preview...", "RUNNING");
      const sandbox = await getSandbox(SandboxId);
      const host = sandbox.getHost(3000);
      await reportProgress(event.data.projectId, "Building your app preview...", "DONE");
      return `https://${host}`;
    });

    // --- 6. Persist Generated Results & Fragment in Database ---
    const fileCount = Object.keys(agentResult.files || {}).length;
    const isError = fileCount === 0;

    await step.run("save-results", async () => {
      await reportProgress(event.data.projectId, "Saving results...", "RUNNING");

      if (isError) {
        const msg = await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong during generation. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
        await cleanupProgress(event.data.projectId);
        return msg;
      }

      const msg = await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: agentResult.summary || "Here is your generated web application.",
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: agentResult.title || "Web Application",
              files: agentResult.files,
            },
          },
        },
      });

      // --- 7. Auto-sync to GitHub if Repo Connected ---
      const project = await prisma.project.findUnique({
        where: { id: event.data.projectId },
        select: { githubRepo: true, userId: true },
      });

      if (project?.githubRepo && agentResult.files) {
        await step.run("sync-github-repo", async () => {
          try {
            await reportProgress(event.data.projectId, "Syncing code to GitHub...", "RUNNING");
            const client = await clerkClient();
            const tokens = await client.users.getUserOauthAccessToken(project.userId, "oauth_github");
            const token = tokens.data[0]?.token;

            if (token) {
              const [owner, repo] = project.githubRepo!.split("/");
              await pushFilesToGitHubRepo(
                token,
                owner,
                repo,
                agentResult.files,
                `Auto-sync update from Vibel Multi-Agent Engine`
              );
              await reportProgress(event.data.projectId, "Syncing code to GitHub...", "DONE");
            }
          } catch (err) {
            console.error("GitHub auto-sync warning:", err);
          }
        });
      }

      await cleanupProgress(event.data.projectId);
      return msg;
    });

    return {
      url: sandboxUrl,
      title: agentResult.title,
      files: agentResult.files,
      summary: agentResult.summary,
      qaScore: agentResult.qaScore,
    };
  }
);
