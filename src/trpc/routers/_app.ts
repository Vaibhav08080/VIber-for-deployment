import { projectsRouter } from '@/modules/projects/server/procedures';
import { createTRPCRouter } from '../init';

import { messagesRouter } from '@/modules/messages/server/procedures';
import { usageRouter } from '@/modules/usage/server/procedure';
import { progressRouter } from '@/modules/progress/server/procedures';
import { githubRouter } from '@/modules/github/server/procedures';
import { supabaseRouter } from '@/modules/supabase/server/procedures';

export const appRouter = createTRPCRouter({
  messages: messagesRouter,
  projects: projectsRouter,
  usage: usageRouter,
  progress: progressRouter,
  github: githubRouter,
  supabase: supabaseRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;