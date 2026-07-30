import { createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { protectedProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client"
import { generateSlug } from "random-word-slugs";
import { TRPCError } from "@trpc/server";
import { ConsumeCredits } from "@/lib/usage";
import OpenAI from "openai";
export const projectsRouter = createTRPCRouter({
    getOne: protectedProcedure
    .input(
        z.object({
            id: z.string().min(1,{message:"Project ID is required"})
        })
    )
    .query(async ({input,ctx}) => {
        const existingProject = await prisma.project.findUnique({
            where:{
                id: input.id,
                userId:ctx.auth.userId
            }
        })
        if(!existingProject){
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Project not found"
            })
        }
        return existingProject;
    }),
    getMany: protectedProcedure.query(async ({ctx}) => {
        try {
            const projects = await prisma.project.findMany({
                where:{
                    userId:ctx.auth.userId
                },
                orderBy: {
                    updatedAt: "desc"
                },
            });
            return projects;
        } catch (error) {
            console.error("Error fetching projects:", error);
            return [];
        }
    }),
    create: protectedProcedure
        .input(
            z.object({
                value: z.string()
                .min(1, { message: "Value is required" })
                .max(10000, { message: "Value is too long" }),
                imageUrl: z.string().optional(),
            })
        )
        .mutation(async ({ input ,ctx }) => {
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
            const CreatedProject = await prisma.project.create({
                data:{
                    name:generateSlug(2,{format: "kebab"}),
                    userId:ctx.auth.userId,
                    messages: {
                        create: {
                            content: input.value,
                            imageUrl: input.imageUrl,
                            role: "USER",
                            type: "RESULT"
                        }
                    }

                }

            })

           

            await inngest.send({
                name: "code-agent/run",
                    data: {
                      value: input.value,
                      imageUrl: input.imageUrl,
                      projectId: CreatedProject.id,
                    },

                });
                return CreatedProject;

            }),
    rename: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1, { message: "Project ID is required" }),
                name: z.string().min(1, { message: "Name is required" }).max(100, { message: "Name is too long" }),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const existingProject = await prisma.project.findUnique({
                where: { id: input.id, userId: ctx.auth.userId },
            });
            if (!existingProject) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
            }
            return await prisma.project.update({
                where: { id: input.id },
                data: { name: input.name.trim() },
            });
        }),
    delete: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1, { message: "Project ID is required" }),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const existingProject = await prisma.project.findUnique({
                where: { id: input.id, userId: ctx.auth.userId },
            });
            if (!existingProject) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
            }
            // onDelete: Cascade in schema handles messages + fragments automatically
            return await prisma.project.delete({
                where: { id: input.id },
            });
        }),
    deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
        try {
            return await prisma.project.deleteMany({
                where: { userId: ctx.auth.userId },
            });
        } catch (error) {
            console.error("Error deleting all projects:", error);
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to delete projects",
            });
        }
    }),
    enhancePrompt: protectedProcedure
        .input(
            z.object({
                prompt: z.string().min(1).max(10000),
            })
        )
        .mutation(async ({ input }) => {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert prompt engineer for an AI-powered web app builder (like Bolt.new or v0.dev).
Your job is to take a user's rough idea and transform it into a clear, detailed, technical prompt that will produce excellent results.

Rules:
- Keep the core idea exactly the same — don't change what they want to build
- Add specific technical details: UI components needed, features, interactions
- Mention design preferences if missing (modern, clean, responsive)
- Add relevant technical stack hints if helpful
- Keep it concise but complete (2-4 sentences max)
- Output ONLY the enhanced prompt — no explanations, no preamble, no quotes`,
                    },
                    {
                        role: "user",
                        content: input.prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 500,
            });

            const enhanced = response.choices[0]?.message?.content?.trim();
            if (!enhanced) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Enhancement failed" });
            }
            return { enhanced };
        }),
        })