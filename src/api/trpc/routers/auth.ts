import { publicProcedure, router } from "../trpc";

export const authRouter = router({
  isAdmin: publicProcedure.query(async ({ ctx }) => {
    return ctx.isAdmin;
  }),
});
