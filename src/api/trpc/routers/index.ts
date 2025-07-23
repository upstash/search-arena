import { router } from "../trpc";
import { databaseRouter } from "./database";
import { battleRouter } from "./battle";

// Root router
export const appRouter = router({
  database: databaseRouter,
  battle: battleRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
