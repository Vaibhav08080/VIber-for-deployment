import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const progressRouter = createTRPCRouter({
  getSteps: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, { message: "Project ID is required" }),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify project belongs to user
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
      });
      if (!project) return [];

      const steps = await prisma.progressStep.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          step: true,
          status: true,
          createdAt: true,
        },
      });
      return steps;
    }),
});
