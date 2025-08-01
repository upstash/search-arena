import { BattleService, DatabaseService } from "../services";
import { getOrCreateSessionId } from "../../lib/session-middleware";
import { isDev } from "@/lib/dev";

/**
 * Create context for the tRPC API
 */
export async function createTRPCContext() {
  const sessionId = await getOrCreateSessionId();

  return {
    databaseService: new DatabaseService(),
    battleService: new BattleService(),
    sessionId,
    isAdmin: isDev,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
