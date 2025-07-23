import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { TRPCContext } from "./context";

/**
 * Initialize tRPC
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;
