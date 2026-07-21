import { createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { protectedProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client"
import { generateSlug } from "random-word-slugs";
import { TRPCError } from "@trpc/server";
import { ConsumeCredits } from "@/lib/usage";
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
        const projects = await prisma.project.findMany({
            where:{
                userId:ctx.auth.userId
            },
            orderBy: {
                updatedAt: "desc"
            },
        })
        return projects;
    }),
    create: protectedProcedure
        .input(
            z.object({
                value: z.string()
                .min(1, { message: "Value is required" })
                .max(10000, { message: "Value is too long" })
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
        })