import { openai, createAgent, createTool, createNetwork, type Tool, Message, createState } from "@inngest/agent-kit";
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent, sanitizeClientComponents, autoInstallMissingPackages } from "./utils";
import { z } from "zod";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "../prompt";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { pushFilesToGitHubRepo } from "@/lib/github";
import { clerkClient } from "@clerk/nextjs/server";

interface AgentState{
  summary: string;
  files:{[path: string]: string};
}

async function updateProgress(projectId: string, stepName: string, status: "RUNNING" | "DONE" | "ERROR" = "RUNNING") {
  if (status === "RUNNING") {
    await prisma.progressStep.create({
      data: { projectId, step: stepName, status: "RUNNING" },
    });
  } else {
    await prisma.progressStep.updateMany({
      where: { projectId, step: stepName, status: "RUNNING" },
      data: { status },
    });
  }
}

async function completeProgress(projectId: string, stepName: string) {
  await prisma.progressStep.updateMany({
    where: { projectId, step: stepName, status: "RUNNING" },
    data: { status: "DONE" },
  });
}

async function cleanupProgress(projectId: string) {
  await prisma.progressStep.updateMany({
    where: { projectId, status: "RUNNING" },
    data: { status: "DONE" },
  });
}

export const CodeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {

    if (event.data.mode === "DISCUSS") {
      const content = await step.run("generate-discuss-response", async () => {
        const messages = await prisma.message.findMany({
          where: { projectId: event.data.projectId },
          orderBy: { createdAt: "asc" },
        });

        const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          {
            role: "system",
            content: `You are an expert AI software architect and senior product designer for an AI web app builder.
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

    // --- Progress: Setting up sandbox ---
    const SandboxId = await step.run("get-sandbox-id", async () => {
      await updateProgress(event.data.projectId, "Setting up sandbox...");
      const sandbox = await Sandbox.create("viber-nextjs", {
        timeoutMs: 60 * 60 * 1000,
      });
      await completeProgress(event.data.projectId, "Setting up sandbox...");
      return sandbox.sandboxId;
    });

 // --- Progress: Loading conversation ---
  const previousMessages = await step.run("get-previous-messages", async () => {
    await updateProgress(event.data.projectId, "Loading conversation history...");
    const formattedMessages: Message[] = [];
    const messages = await prisma.message.findMany({
      where: {
        projectId: event.data.projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });
    messages.reverse();

    for (const message of messages) {
      if (message.imageUrl) {
        formattedMessages.push({
          type: "text",
          role: message.role === "ASSISTANT" ? "assistant" : "user",
          content: [
            { type: "text", text: message.content },
            { type: "image_url", image_url: { url: message.imageUrl } }
          ] as any,
        });
      } else {
        formattedMessages.push({
          type: "text",
          role: message.role === "ASSISTANT" ? "assistant" : "user",
          content: message.content,
        });
      }
    }
    await completeProgress(event.data.projectId, "Loading conversation history...");
    return formattedMessages;
  });

  const State = createState<AgentState>(
    {
      summary: "",
      files: {},
    },
    {
      messages: previousMessages,
    }
  );

  const projectDb = await step.run("get-project-details", async () => {
    return await prisma.project.findUnique({
      where: { id: event.data.projectId },
      select: { supabaseUrl: true, supabaseAnonKey: true },
    });
  });

  let systemPrompt = PROMPT;
  if (projectDb?.supabaseUrl && projectDb?.supabaseAnonKey) {
    systemPrompt += `\n\nSUPABASE DATABASE CONNECTED:
This project is connected to the user's live Supabase instance:
- Supabase URL: "${projectDb.supabaseUrl}"
- Supabase Anon Key: "${projectDb.supabaseAnonKey}"

You MUST:
1. Use the terminal tool to install @supabase/supabase-js if needed ("npm install @supabase/supabase-js --yes").
2. Create a Supabase client helper at "lib/supabase.ts":
   import { createClient } from "@supabase/supabase-js";
   export const supabase = createClient("${projectDb.supabaseUrl}", "${projectDb.supabaseAnonKey}");
3. Use real Supabase client queries (e.g., supabase.from('items').select('*')) for backend/data logic.
4. Provide a "supabase/schema.sql" file containing the SQL DDL statements (CREATE TABLE, RLS policies) for setting up the user's Supabase tables.
`;
  }

  const codeAgent = createAgent<AgentState>({
    name: "code-agent",
    description: "An expert coding agent",
    system: systemPrompt,
    model: openai({
      model: "gpt-4o",
      defaultParameters: {
        temperature: 0.1,
      },
    }),
      tools: [

        // ✅ FIXED terminal tool
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(SandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return result.stdout;
              } catch (error) {
                console.error(`Command failed: ${error} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`);
                return `Command failed: ${error} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
              }
            });
          }
        }),

        createTool({
          name: "createOrupdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            )
          }),
          handler: async ({ files }, { step, network } : Tool.Options<AgentState>) => {
            const newFiles = await step?.run("createOrupdateFiles", async () => {
              try {
                const updatedFiles = network.state.data.files || {};
                const sandbox = await getSandbox(SandboxId);
                // Self-Healing QA: Auto-insert "use client" header if missing on React client components
                const rawFileMap: Record<string, string> = {};
                for (const file of files) {
                  rawFileMap[file.path] = file.content;
                }
                const sanitizedMap = sanitizeClientComponents(rawFileMap);

                await Promise.all(
                  Object.entries(sanitizedMap).map(async ([filePath, content]) => {
                    await sandbox.files.write(filePath, content);
                    updatedFiles[filePath] = content;
                  })
                );
                return updatedFiles;
              } catch (error) {
                return "Error:" + error;
              }
            });

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }

            return newFiles;
          }
        }),

        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            const newFiles = await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(SandboxId);
                const contents = [];
                for (const filePath of files) {
                  const content = await sandbox.files.read(filePath);
                  contents.push({ path: filePath, content });
                }
                return JSON.stringify(contents);
              } catch (error) {
                return "Error:" + error;
              }
            });

            return newFiles;
          }
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText = lastAssistantTextMessageContent(result);
          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: State,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      }
    });

    // --- Progress: AI coding ---
    await step.run("progress-ai-coding", async () => {
      await updateProgress(event.data.projectId, "AI is writing your code...");
    });

    const result = await network.run(event.data.value ,{ state: State});

    await step.run("progress-ai-coding-done", async () => {
      await completeProgress(event.data.projectId, "AI is writing your code...");
    });

    // --- Progress: Self-Healing QA Check ---
    await step.run("qa-self-healing-packages", async () => {
      await updateProgress(event.data.projectId, "Running QA diagnostics & auto-healing...");
      const sandbox = await getSandbox(SandboxId);
      if (result.state.data.files) {
        await autoInstallMissingPackages(sandbox, result.state.data.files);
      }
      await completeProgress(event.data.projectId, "Running QA diagnostics & auto-healing...");
    });

    // --- Progress: Generating title & response (Lightweight step, zero token bloat) ---
    await step.run("progress-generating-title", async () => {
      await updateProgress(event.data.projectId, "Generating app title...");
    });

    const titleAndResponse = await step.run("generate-title-and-response", async () => {
      try {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const res = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Generate a JSON object with:
1. "title": Short 2-3 word title for the app (Title Case, no quotes)
2. "response": Friendly 1-2 sentence message describing what was built.
Return ONLY raw JSON with keys "title" and "response".`
            },
            {
              role: "user",
              content: event.data.value
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 150,
        });

        const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
        return {
          title: parsed.title || "Web Application",
          response: parsed.response || "Here is your generated web application.",
        };
      } catch (err) {
        return {
          title: "Web Application",
          response: "Here is your generated web application.",
        };
      }
    });

    await step.run("progress-generating-title-done", async () => {
      await completeProgress(event.data.projectId, "Generating app title...");
    });

    const fileCount = Object.keys(result.state.data.files || {}).length;
    const isError = fileCount === 0;

    // --- Progress: Building preview ---
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      await updateProgress(event.data.projectId, "Building your app preview...");
      const sandbox = await getSandbox(SandboxId);
      const host = sandbox.getHost(3000);
      await completeProgress(event.data.projectId, "Building your app preview...");
      return `https://${host}`;
    });

    // --- Progress: Saving results ---
    await step.run("save-results" , async () =>{
      await updateProgress(event.data.projectId, "Saving results...");

      if (isError) {
        const msg = await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong, please try again",
            role: "ASSISTANT",
            type: "ERROR",
          }
        });
        await cleanupProgress(event.data.projectId);
        return msg;
      }
      const msg = await prisma.message.create({
        data:{
          projectId: event.data.projectId,
          content: titleAndResponse.response,
          role: "ASSISTANT",
          type: "RESULT",
          fragment:{
            create:{
              sandboxUrl: sandboxUrl,
              title: titleAndResponse.title,
              files: result.state.data.files,
            }
          }
        }
      });

      // --- Progress: Auto-sync to GitHub if repo connected ---
      const project = await prisma.project.findUnique({
        where: { id: event.data.projectId },
        select: { githubRepo: true, userId: true },
      });

      if (project?.githubRepo && result.state.data.files) {
        await step.run("sync-github-repo", async () => {
          try {
            await updateProgress(event.data.projectId, "Syncing code to GitHub...");
            const client = await clerkClient();
            const tokens = await client.users.getUserOauthAccessToken(project.userId, "oauth_github");
            const token = tokens.data[0]?.token;

            if (token) {
              const [owner, repo] = project.githubRepo!.split("/");
              await pushFilesToGitHubRepo(
                token,
                owner,
                repo,
                result.state.data.files,
                `Auto-sync update from SparkSite AI`
              );
              await completeProgress(event.data.projectId, "Syncing code to GitHub...");
            }
          } catch (err) {
            console.error("GitHub auto-sync warning:", err);
          }
        });
      }

      await cleanupProgress(event.data.projectId);
      return msg;
    })

    return {
      url: sandboxUrl,
      title: titleAndResponse.title,
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);
