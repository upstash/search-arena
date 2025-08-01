import { router } from "../trpc";
import { databaseRouter } from "./database";
import { battleRouter } from "./battle";
import { authRouter } from "./auth";

// Root router
export const appRouter = router({
  database: databaseRouter,
  battle: battleRouter,
  auth: authRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
