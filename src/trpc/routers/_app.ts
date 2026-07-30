import { projectsRouter } from '@/modules/projects/server/procedures';
import {  createTRPCRouter } from '../init';

import { messagesRouter } from '@/modules/mesages/server/procedures';
import { usageRouter } from '@/modules/usage/server/procedure';
import { progressRouter } from '@/modules/progress/server/procedures';
export const appRouter = createTRPCRouter({
  messages: messagesRouter,
  projects: projectsRouter,
  usage:usageRouter,
  progress: progressRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;