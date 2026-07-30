import { createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { protectedProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client"
import { TRPCError } from "@trpc/server";
import { ConsumeCredits } from "@/lib/usage";
import OpenAI from "openai";

export const messagesRouter = createTRPCRouter({
    getMany: protectedProcedure
        .input(
            z.object({
                projectId: z.string().min(1, { message: "Project ID is required" })

            })
        )
        .query(async ({ input ,ctx }) => {
            const messages =await prisma.message.findMany({
                where:{
                    projectId: input.projectId,
                    project:{
                        userId:ctx.auth.userId
                    }
                },
                include:{
                    fragment:true
                },

                orderBy:{
                    updatedAt: "asc"
                }
            })
            return messages;
        }),
    create: protectedProcedure
        .input(
            z.object({
                value: z.string()
                    .min(1, { message: "Value is required" })
                    .max(10000, { message: "Value is too long" }),
                projectId: z.string().min(1, { message: "Project ID is required" }),
                imageUrl: z.string().optional(),
                mode: z.enum(["BUILD", "DISCUSS"]).default("BUILD"),
            })
        )
        .mutation(async ({ input ,ctx }) => {
            const existingProject = await prisma.project.findUnique({
                where:{
                    id: input.projectId,
                    userId:ctx.auth.userId
                }
            })
            if(!existingProject){
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Project not found"
                })
            }
           try{
            await ConsumeCredits();
           }catch(error){
            if (error instanceof Error){
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Something went wrong"
                })
            }else{
                throw new TRPCError({
                    code: "TOO_MANY_REQUESTS",
                    message: "You have run out of credits"
                })
            }
           }

            const CreatedMessage = await prisma.message.create({
                data: {
                    projectId: existingProject.id,
                    content: input.value,
                    imageUrl: input.imageUrl,
                    role: "USER",
                    type: "RESULT",
                    mode: input.mode,
                }
            });

            // DISCUSS mode: instant OpenAI response, no Inngest
            if (input.mode === "DISCUSS") {
                const previousMessages = await prisma.message.findMany({
                    where: { projectId: input.projectId },
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

                for (const msg of previousMessages) {
                    if (msg.role === "ASSISTANT") {
                        formattedMessages.push({ role: "assistant", content: msg.content });
                    } else {
                        if (msg.imageUrl) {
                            formattedMessages.push({
                                role: "user",
                                content: [
                                    { type: "text", text: msg.content },
                                    { type: "image_url", image_url: { url: msg.imageUrl } },
                                ],
                            });
                        } else {
                            formattedMessages.push({ role: "user", content: msg.content });
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

                const aiContent = response.choices[0]?.message?.content || "Here is my advice on your project.";

                await prisma.message.create({
                    data: {
                        projectId: input.projectId,
                        content: aiContent,
                        role: "ASSISTANT",
                        type: "RESULT",
                        mode: "DISCUSS",
                    },
                });

                return CreatedMessage;
            }

            // BUILD mode: trigger Inngest for code generation
            await inngest.send({
                name: "code-agent/run",
                    data: {
                      value: input.value,
                      projectId: input.projectId,
                      mode: input.mode,
                    },

                });
                return CreatedMessage;
        
            })
        })
    