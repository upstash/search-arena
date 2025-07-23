import { BattleService, DatabaseService } from "../services";

// Define a more flexible context type for both App Router and Pages Router
type ContextOptions = {
  req: Request | { headers: Headers } | undefined;
  res?: Response | undefined;
};

/**
 * Create context for the tRPC API
 */
export function createTRPCContext(_opts: ContextOptions) {
  return {
    databaseService: new DatabaseService(),
    battleService: new BattleService(),
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
