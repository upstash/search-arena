import { z } from "zod";
import {
  protectedProcedure,
  publicProcedure,
  ratelimitProcedure,
  router,
} from "../trpc";
import { after } from "next/server";
import { PROVIDERS } from "@/lib/providers";

// Search config schema - union of all provider configs from PROVIDERS registry
const searchConfigSchema = z.union([
  PROVIDERS.upstash_search.searchConfigSchema,
  PROVIDERS.algolia.searchConfigSchema,
]);

// Input validation schemas
const createBattleSchema = z.object({
  label: z.string().min(1),
  databaseId1: z.uuid(),
  databaseId2: z.uuid(),
  // Configs as JSON objects, validated with provider schemas
  config1: searchConfigSchema,
  config2: searchConfigSchema,
  queries: z.string().min(1),
});

// Battle router
export const battleRouter = router({
  // Get all battles for the current session
  getAll: publicProcedure
    .input(z.object({ isDemo: z.boolean() }))
    .query(async ({ ctx, input }) => {
      return ctx.battleService.getAllBattles({
        sessionId: ctx.sessionId,
        isDemo: input.isDemo,
      });
    }),

  // Get battle by ID
  getById: ratelimitProcedure("get", 100)
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.battleService.getBattleById(input.id);

      return res;
    }),

  // Create a new battle
  create: ratelimitProcedure("scan", 4)
    .input(createBattleSchema)
    .mutation(async ({ ctx, input }) => {
      const { battle, sideEffect } = await ctx.battleService.createBattle({
        label: input.label,
        databaseId1: input.databaseId1,
        databaseId2: input.databaseId2,
        // Stringify for storage since service expects JSON strings
        config1: JSON.stringify(input.config1),
        config2: JSON.stringify(input.config2),
        queries: input.queries,
        sessionId: ctx.sessionId,
      });

      after(async () => {
        await sideEffect();
      });

      return battle;
    }),

  // Delete a battle
  delete: publicProcedure
    .input(z.object({ battleId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.battleService.deleteBattle(input.battleId, ctx.sessionId);
    }),

  edit: protectedProcedure
    .input(z.object({ battleId: z.uuid(), isDemo: z.boolean() }))
    .mutation(async ({ ctx, input: { battleId, isDemo } }) => {
      return ctx.battleService.editBattle({
        battleId,
        isDemo,
      });
    }),
});
