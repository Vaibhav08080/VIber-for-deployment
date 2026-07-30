import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getGitHubUserProfile, createOrGetGitHubRepo, pushFilesToGitHubRepo } from "@/lib/github";

export const githubRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const client = await clerkClient();
        const tokens = await client.users.getUserOauthAccessToken(ctx.auth.userId, "oauth_github");
        const token = tokens.data[0]?.token;

        if (!token) {
          return {
            isConnected: false,
            user: null,
            projectGithubRepo: null,
            projectGithubUrl: null,
          };
        }

        const user = await getGitHubUserProfile(token).catch(() => null);

        let projectGithubRepo = null;
        let projectGithubUrl = null;

        if (input?.projectId) {
          const project = await prisma.project.findUnique({
            where: { id: input.projectId, userId: ctx.auth.userId },
            select: { githubRepo: true, githubUrl: true },
          });
          projectGithubRepo = project?.githubRepo || null;
          projectGithubUrl = project?.githubUrl || null;
        }

        return {
          isConnected: !!user,
          user,
          projectGithubRepo,
          projectGithubUrl,
        };
      } catch {
        return {
          isConnected: false,
          user: null,
          projectGithubRepo: null,
          projectGithubUrl: null,
        };
      }
    }),

  exportRepo: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, { message: "Project ID is required" }),
        repoName: z.string().min(1, { message: "Repository name is required" }),
        isPrivate: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 1. Verify project exists & belongs to user
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found.",
        });
      }

      // 2. Fetch latest code fragment
      const lastMessageWithFragment = await prisma.message.findFirst({
        where: {
          projectId: input.projectId,
          role: "ASSISTANT",
          fragment: { isNot: null },
        },
        orderBy: { createdAt: "desc" },
        include: { fragment: true },
      });

      if (!lastMessageWithFragment?.fragment?.files) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No generated code fragment found to export.",
        });
      }

      const files = lastMessageWithFragment.fragment.files as { [path: string]: string };

      // 3. Retrieve GitHub OAuth token via Clerk
      const client = await clerkClient();
      const tokens = await client.users.getUserOauthAccessToken(ctx.auth.userId, "oauth_github");
      const token = tokens.data[0]?.token;

      if (!token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "GitHub account not connected. Please connect your GitHub account via Clerk login or account settings.",
        });
      }

      try {
        // 4. Create or get GitHub Repo
        const repoInfo = await createOrGetGitHubRepo(token, input.repoName, input.isPrivate);

        // 5. Commit and push files
        await pushFilesToGitHubRepo(
          token,
          repoInfo.owner,
          repoInfo.name,
          files,
          `Exported from SparkSite (${project.name})`
        );

        // 6. Save repo details to DB
        await prisma.project.update({
          where: { id: input.projectId },
          data: {
            githubRepo: repoInfo.full_name,
            githubUrl: repoInfo.html_url,
          },
        });

        return {
          githubUrl: repoInfo.html_url,
          fullName: repoInfo.full_name,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err?.message || "Failed to push repository to GitHub.",
        });
      }
    }),
});
