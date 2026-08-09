import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { testSupabaseConnection } from "@/lib/supabase-service";
import { executeSupabaseSQL } from "@/lib/supabase-provisioner";

export const supabaseRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const project = await prisma.project.findUnique({
        where: { id: input.projectId, userId: ctx.auth.userId },
        select: { supabaseUrl: true, supabaseAnonKey: true },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const isConnected = !!(project.supabaseUrl && project.supabaseAnonKey);

      return {
        isConnected,
        supabaseUrl: project.supabaseUrl || null,
        supabaseAnonKey: project.supabaseAnonKey
          ? `${project.supabaseAnonKey.slice(0, 10)}...${project.supabaseAnonKey.slice(-6)}`
          : null,
      };
    }),

  saveCredentials: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        supabaseUrl: z.string().min(1, "Supabase URL is required"),
        supabaseAnonKey: z.string().min(1, "Supabase Anon Key is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findUnique({
        where: { id: input.projectId, userId: ctx.auth.userId },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Test connection before saving
      const testResult = await testSupabaseConnection(input.supabaseUrl, input.supabaseAnonKey);

      if (!testResult.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: testResult.message,
        });
      }

      const updatedProject = await prisma.project.update({
        where: { id: input.projectId },
        data: {
          supabaseUrl: input.supabaseUrl.trim(),
          supabaseAnonKey: input.supabaseAnonKey.trim(),
        },
      });

      return {
        success: true,
        message: "Supabase connection saved successfully!",
        supabaseUrl: updatedProject.supabaseUrl,
      };
    }),

  syncSchema: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        sqlContent: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findUnique({
        where: { id: input.projectId, userId: ctx.auth.userId },
        select: { supabaseUrl: true, supabaseAnonKey: true },
      });

      if (!project || !project.supabaseUrl || !project.supabaseAnonKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No connected Supabase database found for this project.",
        });
      }

      const sql = input.sqlContent || "CREATE TABLE IF NOT EXISTS items (id uuid primary key default gen_random_uuid(), created_at timestamptz default now());";
      const result = await executeSupabaseSQL(project.supabaseUrl, project.supabaseAnonKey, sql);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return {
        success: true,
        message: "Supabase database schema verified and synchronized!",
      };
    }),

  disconnect: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findUnique({
        where: { id: input.projectId, userId: ctx.auth.userId },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      await prisma.project.update({
        where: { id: input.projectId },
        data: {
          supabaseUrl: null,
          supabaseAnonKey: null,
        },
      });

      return {
        success: true,
        message: "Supabase connection removed.",
      };
    }),
});
