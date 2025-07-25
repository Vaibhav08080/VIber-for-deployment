import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { auth } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';

// Create context that works with fetch adapter
export const createTRPCContext = async () => {
  // Don't call auth() here - let it be called in the procedures
  return {};
};

export type context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<context>().create({
  transformer: superjson,
});

// Modified middleware that calls auth() within the request context
const isAuthed = t.middleware(async ({ next, ctx }) => {
  const authResult = await auth();
  
  if (!authResult.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }
  
  return next({
    ctx: {
      ...ctx,
      auth: authResult
    }
  });
});

// Public procedure that adds auth to context
const withAuth = t.procedure.use(async ({ next, ctx }) => {
  const authResult = await auth();
  return next({
    ctx: {
      ...ctx,
      auth: authResult
    }
  });
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = withAuth; // All procedures now have auth in context
export const protectedProcedure = t.procedure.use(isAuthed);