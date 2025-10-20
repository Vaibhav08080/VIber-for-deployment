import { openai, createAgent, createTool, createNetwork, type Tool, Message, createState } from "@inngest/agent-kit";
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { z } from "zod";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "../prompt";
import { prisma } from "@/lib/db";



interface AgentState{
  summary: string;
  files:{[path: string]: string};
}

export const CodeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {

    const SandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("viber-nextjs");
      return sandbox.sandboxId;
    });

 const previousMessages = await step.run("get-previous-messages", async () => {
  const formattedMessages:Message[] = [];
    const messages = await prisma.message.findMany({
      where:{
        projectId: event.data.projectId,
      },
      orderBy:{
        createdAt:"asc",   // desc to asc
      },
    })
    for (const message of messages) {
      formattedMessages.push({
        type:"text",
        role: message.role ==="ASSISTANT" ? "assistant" : "user",
        content: message.content,
      });
    }
    return formattedMessages;
 })  
 const State = createState<AgentState>({
    summary: "",
    files: {},
 },{
  messages: previousMessages,
 }
)
    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({
        model: "gpt-4.1",
        defaultParameters: {
          temperature: 0.1,
        }
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
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }
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

    const result = await network.run(event.data.value ,{ state: State});

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "Generates a title for a code fragment",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({
        model: "gpt-4o",
        defaultParameters: {
          temperature: 0.1,
        }
      }),
    });
    const responseGenerator = createAgent({
      name: "response-generator",
      description: "Generates a title for a code fragment",
      system: RESPONSE_PROMPT,
      model: openai({
        model: "gpt-4o",
        defaultParameters: {
          temperature: 0.1,
        }
      }),
    });
    const {output : fragmentTitleOutput} = await fragmentTitleGenerator.run(result.state.data.summary);
    const {output : responseOutput} = await responseGenerator.run(result.state.data.summary);


    const generateFragmentTitle = () =>{
      if(fragmentTitleOutput[0].type !== "text"){
        return "Fragment"
      }
      if (Array.isArray(fragmentTitleOutput[0].content)){
        return fragmentTitleOutput[0].content.map((txt)=>txt).join("")
      }
      else{
        return fragmentTitleOutput[0].content
      }

      
    }

    const generateResponse = () =>{
      if(responseOutput[0].type !== "text"){
        return "Here you go"
      }
      if (Array.isArray(responseOutput[0].content)){
        return responseOutput[0].content.map((txt)=>txt).join("")
      }
      else{
        return responseOutput[0].content
      }
    }

    const isError = 
     !result.state.data.summary ||
     Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(SandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-results" , async () =>{

      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong, please try again",
            role: "ASSISTANT",
            type: "ERROR",
          }
        });
      }
      return await prisma.message.create({
        data:{
          projectId: event.data.projectId,
          content: generateResponse(),
          role: "ASSISTANT",
          type: "RESULT",
          fragment:{
            create:{
              sandboxUrl: sandboxUrl,
              title:generateFragmentTitle(),
              files: result.state.data.files,
            }
          }
        }
      })
    })

    return {
      url: sandboxUrl,
      title: generateFragmentTitle(),
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);
