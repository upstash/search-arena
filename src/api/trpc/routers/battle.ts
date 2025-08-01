import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { after } from "next/server";

// Input validation schemas
const createBattleSchema = z.object({
  label: z.string().min(1),
  databaseId1: z.uuid(),
  databaseId2: z.uuid(),
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
  getById: publicProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.battleService.getBattleById(
        input.id,
        ctx.sessionId
      );

      return res;
    }),

  // Create a new battle
  create: publicProcedure
    .input(createBattleSchema)
    .mutation(async ({ ctx, input }) => {
      const { battle, sideEffect } = await ctx.battleService.createBattle(
        input.label,
        input.databaseId1,
        input.databaseId2,
        input.queries,
        ctx.sessionId
      );

      after(async () => {
        await sideEffect();
      });

      return battle;
    }),

  // Retry a failed battle
  retry: publicProcedure
    .input(z.object({ battleId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { success, sideEffect } = await ctx.battleService.retryBattle(
        input.battleId
      );

      after(async () => {
        await sideEffect();
      });

      return { success };
    }),

  // Delete a battle
  delete: publicProcedure
    .input(z.object({ battleId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.battleService.deleteBattle(input.battleId, ctx.sessionId);
    }),

  // Get battle query results
  getQueryResults: publicProcedure
    .input(z.object({ battleId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.battleService.getBattleQueryResults(
        input.battleId,
        ctx.sessionId
      );
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
