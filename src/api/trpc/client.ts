import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "./routers";

/**
 * Create a tRPC client for React components
 */
export const trpc = createTRPCReact<AppRouter>();
