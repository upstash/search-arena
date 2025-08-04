import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { TRPCContext } from "./context";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new Error("Unauthorized");
  }
  return next();
});

/**
 * Ratelimit procedure, requests per 1 hour window
 */
export const ratelimitProcedure = (id: string, limit: number) =>
  publicProcedure.use(async ({ ctx, next }) => {
    // Create a new ratelimiter instance
    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, "1h"),
      analytics: true,
      prefix: "@upstash/ratelimit:" + id,
    });

    // Use the client IP address as the identifier for rate limiting
    // Fall back to sessionId if IP is not available
    const identifier = ctx.ip ?? "missing-ip";
    console.log("identifier > ", identifier);
    const { success } = await ratelimit.limit(identifier);

    if (!success) {
      throw new Error("Too many requests. Please try again later.");
    }

    return next();
  });
