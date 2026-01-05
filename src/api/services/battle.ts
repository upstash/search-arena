import { db, schema } from "../db";
import { createSearchProvider } from "../providers";
import { LLMService } from "./llm";
import { and, eq, or } from "drizzle-orm";
import { parseCredentials, parseSearchConfig } from "@/lib/providers";

type CreateBattleParams = {
  label: string;
  databaseId1: string;
  databaseId2: string;
  config1: string; // JSON string
  config2: string; // JSON string
  queries: string;
  sessionId?: string;
  ratingCount?: number;
};

export class BattleService {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  /**
   * Creates a new battle between two databases
   */
  async createBattle(params: CreateBattleParams) {
    const {
      label,
      databaseId1,
      databaseId2,
      config1,
      config2,
      queries,
      sessionId,
    } = params;

    // Create the battle record with configs (already JSON strings)
    const [battle] = await db
      .insert(schema.battles)
      .values({
        label,
        databaseId1,
        databaseId2,
        config1,
        config2,
        status: "pending",
        queries,
        sessionId,
        ratingCount: params.ratingCount || 1,
      })
      .returning();

    // Create battle queries
    await Promise.all(
      queries
        .split("\n")
        .map((queryText) => queryText.trim())
        .filter((queryText) => queryText)
        .map(async (queryText) => {
          const [query] = await db
            .insert(schema.battleQueries)
            .values({
              battleId: battle.id,
              queryText,
              ratingCount: params.ratingCount || 1,
            })
            .returning();
          return query;
        }),
    );

    const sideEffect = async () => {
      await this.processBattle(battle.id);
      await this.stopOldBattles();
    };

    return { battle, sideEffect };
  }

  /**
   * Process a battle asynchronously
   */
  async processBattle(battleId: string) {
    try {
      const queries = await db.query.battleQueries.findMany({
        where: eq(schema.battleQueries.battleId, battleId),
      });

      // Update battle status to in_progress
      await db
        .update(schema.battles)
        .set({ status: "in_progress" })
        .where(eq(schema.battles.id, battleId))
        .execute();

      // Get battle details
      const battle = await db.query.battles.findFirst({
        where: eq(schema.battles.id, battleId),
        with: {
          database1: true,
          database2: true,
        },
      });

      if (!battle) {
        throw new Error(`Battle ${battleId} not found`);
      }

      // Check if battle and databases exist
      if (!battle.database1 || !battle.database2) {
        throw new Error("Battle databases not found");
      }

      // Check if databases have credentials
      if (!battle.database1.credentials || !battle.database2.credentials) {
        throw new Error("Database credentials not found");
      }

      // Check if databases are v1 format
      if (battle.database1.version !== 1 || battle.database2.version !== 1) {
        throw new Error(
          "Cannot process battle with v0 (legacy) databases. Please update database credentials to JSON format.",
        );
      }

      // Check if configs are present
      if (!battle.config1 || !battle.config2) {
        throw new Error("Battle configs not found");
      }

      // Parse credentials
      const credentials1 = parseCredentials(
        battle.database1.provider,
        battle.database1.credentials,
      );
      const credentials2 = parseCredentials(
        battle.database2.provider,
        battle.database2.credentials,
      );

      // Parse configs
      const config1 = parseSearchConfig(
        battle.database1.provider,
        battle.config1,
      );
      const config2 = parseSearchConfig(
        battle.database2.provider,
        battle.config2,
      );

      // Create search providers
      const provider1 = createSearchProvider({
        provider: battle.database1.provider,
        credentials: credentials1,
        config: config1,
      });

      const provider2 = createSearchProvider({
        provider: battle.database2.provider,
        credentials: credentials2,
        config: config2,
      });

      // Process each query
      let totalScoreDb1 = 0;
      let totalScoreDb2 = 0;

      // Accumulators for total battle stats
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;
      let totalInputCost = 0;
      let totalOutputCost = 0;
      let totalCost = 0;

      let validQueriesDb1 = 0;
      let validQueriesDb2 = 0;

      const searchQuery = async (query: schema.BattleQuery) => {
        // Helper function to search with timing
        const searchWithTiming = async (
          provider: typeof provider1,
          queryText: string,
        ) => {
          const start = performance.now();
          const searchResponse = await provider.search(queryText);
          const end = performance.now();
          return {
            searchResponse,
            duration: end - start,
          };
        };

        const ratingCount = query.ratingCount || 1;
        const queryScoresDb1: number[] = [];
        const queryScoresDb2: number[] = [];

        for (let i = 0; i < ratingCount; i++) {
          const ratingIndex = i + 1;
          console.log(
            `Processing query "${query.queryText}" - Rating ${ratingIndex}/${ratingCount}`,
          );

          // Run searches in parallel with individual timing
          const [search1, search2] = await Promise.all([
            searchWithTiming(provider1, query.queryText),
            searchWithTiming(provider2, query.queryText),
          ]);

          // Evaluate results with LLM (timing is handled inside the LLM service)
          console.log(`Evaluating results for query:`, query.queryText);
          const { db1, db2, llmDuration, usage } =
            await this.llmService.evaluateSearchResults(
              query.queryText,
              search1.searchResponse.results,
              search2.searchResponse.results,
            );

          totalPromptTokens += usage.inputTokens;
          totalCompletionTokens += usage.outputTokens;
          totalInputCost += usage.inputCost;
          totalOutputCost += usage.outputCost;
          totalCost += usage.totalCost;

          // Merge LLM usage into metadata
          const formatMetadata = (searchMetadata: any) => ({
            ...searchMetadata,
            usage,
          });

          // Store results with timing information
          await db
            .insert(schema.searchResults)
            .values({
              battleQueryId: query.id,
              databaseId: battle.databaseId1,
              configIndex: 1,
              ratingIndex: ratingIndex,
              results: search1.searchResponse.results,
              score: String(db1.score), // Convert to string for Drizzle compatibility
              llmFeedback: db1.feedback,
              searchDuration: String(search1.duration.toFixed(2)),
              llmDuration: String(llmDuration.toFixed(2)),
              metadata: formatMetadata(search1.searchResponse.metadata),
            })
            .execute();

          await db
            .insert(schema.searchResults)
            .values({
              battleQueryId: query.id,
              databaseId: battle.databaseId2,
              configIndex: 2,
              ratingIndex: ratingIndex,
              results: search2.searchResponse.results,
              score: String(db2.score), // Convert to string for Drizzle compatibility
              llmFeedback: db2.feedback,
              searchDuration: String(search2.duration.toFixed(2)),
              llmDuration: String(llmDuration.toFixed(2)),
              metadata: formatMetadata(search2.searchResponse.metadata),
            })
            .execute();

          if (db1.score !== -1) queryScoresDb1.push(db1.score);
          if (db2.score !== -1) queryScoresDb2.push(db2.score);
        }

        // Add average scores to total
        if (queryScoresDb1.length > 0) {
          totalScoreDb1 +=
            queryScoresDb1.reduce((a, b) => a + b, 0) / queryScoresDb1.length;
          validQueriesDb1++;
        }
        if (queryScoresDb2.length > 0) {
          totalScoreDb2 +=
            queryScoresDb2.reduce((a, b) => a + b, 0) / queryScoresDb2.length;
          validQueriesDb2++;
        }
      };

      await Promise.all(
        queries.map(async (query) => {
          try {
            return await searchQuery(query);
          } catch (error) {
            console.error(`Error processing query ${query.queryText}`, error);
            // Update the query with error
            await db
              .update(schema.battleQueries)
              .set({
                error: String(error),
              })
              .where(eq(schema.battleQueries.id, query.id))
              .execute();
          }
        }),
      );

      // Calculate mean scores
      const meanScoreDb1 =
        validQueriesDb1 > 0 ? totalScoreDb1 / validQueriesDb1 : 0;
      const meanScoreDb2 =
        validQueriesDb2 > 0 ? totalScoreDb2 / validQueriesDb2 : 0;

      // Update battle with results
      await db
        .update(schema.battles)
        .set({
          status: "completed",
          completedAt: new Date(),
          meanScoreDb1: meanScoreDb1.toFixed(2),
          meanScoreDb2: meanScoreDb2.toFixed(2),
          metadata: {
            usage: {
              promptTokens: totalPromptTokens,
              completionTokens: totalCompletionTokens,
              totalTokens: totalPromptTokens + totalCompletionTokens,
              inputCost: totalInputCost,
              outputCost: totalOutputCost,
              totalCost: totalCost,
            },
          },
        })
        .where(eq(schema.battles.id, battleId))
        .execute();

      return { success: true };
    } catch (error) {
      console.error(`Error processing battle ${battleId}:`, error);

      // Update battle status to failed
      await db
        .update(schema.battles)
        .set({ status: "failed", error: String(error) })
        .where(eq(schema.battles.id, battleId))
        .execute();

      throw error;
    }
  }

  async stopOldBattles() {
    console.log("Stopping old battles");
    const battles = await db.query.battles.findMany({
      where: or(
        eq(schema.battles.status, "in_progress"),
        eq(schema.battles.status, "pending"),
      ),
    });

    if (battles.length !== 0) {
      console.log(`Stopping ${battles.length} old battles`);
    }

    for (const battle of battles) {
      // Timeout a battle if it's been running for more than 10 minutes
      if (
        battle.createdAt &&
        battle.createdAt.getTime() > Date.now() - 10 * 60 * 1000
      ) {
        continue;
      }

      console.log(`Stopping battle ${battle.id}`);

      await db
        .update(schema.battles)
        .set({ status: "failed", error: "Battle timed out" })
        .where(eq(schema.battles.id, battle.id))
        .execute();
    }
  }

  /**
   * Get all battles for a specific session
   */
  async getAllBattles({
    sessionId,
    isDemo,
  }: {
    sessionId?: string;
    isDemo?: boolean;
  }) {
    const sessionFilter = sessionId
      ? eq(schema.battles.sessionId, sessionId)
      : undefined;
    const demoFilter =
      isDemo !== undefined ? eq(schema.battles.isDemo, isDemo) : undefined;

    // For demo, don't care about the sessionId
    const combinedFilters = isDemo
      ? demoFilter
      : and(sessionFilter, demoFilter);

    return await db.query.battles.findMany({
      where: combinedFilters,
      orderBy: (battles, { desc }) => [desc(battles.createdAt)],
      columns: {
        sessionId: false,
      },
      with: {
        database1: {
          columns: {
            label: true,
            provider: true,
          },
        },
        database2: {
          columns: {
            label: true,
            provider: true,
          },
        },
      },
    });
  }

  /**
   * Get battle details by ID
   */
  async getBattleById(battleId: string, sessionId?: string, isAdmin?: boolean) {
    const battle = await db.query.battles.findFirst({
      // For all, battleId is checked
      where: eq(schema.battles.id, battleId),
      with: {
        database1: {
          columns: {
            label: true,
            provider: true,
          },
        },
        database2: {
          columns: {
            label: true,
            provider: true,
          },
        },
        queries: {
          with: {
            results: true,
          },
        },
      },
    });

    // If battle not found, return null
    if (!battle) throw new Error(`Battle ${battleId} not found`);

    // Check if the user can edit (is owner or admin)
    const isOwner = sessionId && battle.sessionId === sessionId;
    const canEdit = isOwner || isAdmin || false;

    // Return battle without sessionId but with canEdit flag
    const { sessionId: _sessionId, ...battleWithoutSessionId } = battle;
    return { ...battleWithoutSessionId, canEdit };
  }

  /**
   * Retry a failed battle
   */
  async retryBattle(battleId: string) {
    // Get the battle
    const battle = await db.query.battles.findFirst({
      where: eq(schema.battles.id, battleId),
      with: {
        queries: true,
      },
    });

    if (!battle) throw new Error(`Battle ${battleId} not found`);

    if (battle.status === "in_progress") {
      throw new Error(`Battle ${battleId} is already in progress`);
    }

    // Delete existing search results
    for (const query of battle.queries) {
      await db
        .delete(schema.searchResults)
        .where(eq(schema.searchResults.battleQueryId, query.id))
        .execute();
    }

    // Reset battle status
    await db
      .update(schema.battles)
      .set({
        status: "pending",
        completedAt: null,
        meanScoreDb1: null,
        meanScoreDb2: null,
      })
      .where(eq(schema.battles.id, battleId))
      .execute();

    const sideEffect = async () => {
      await this.processBattle(battleId);
      await this.stopOldBattles();
    };

    return { success: true, sideEffect };
  }

  /**
   * Delete a battle and all its related data
   * @param battleId ID of the battle to delete
   * @param sessionId Optional session ID to verify ownership
   */
  async deleteBattle(battleId: string, sessionId?: string) {
    // Check if battle exists
    const battle = await db.query.battles.findFirst({
      where: eq(schema.battles.id, battleId),
    });

    if (!battle) {
      throw new Error(`Battle ${battleId} not found`);
    }

    // If sessionId is provided, verify that it matches the battle's sessionId
    if (sessionId && battle.sessionId && battle.sessionId !== sessionId) {
      throw new Error(`Battle ${battleId} not found`);
    }

    // Delete the battle (cascade will handle related data)
    await db
      .delete(schema.battles)
      .where(eq(schema.battles.id, battleId))
      .execute();

    return { success: true };
  }

  /**
   * Sets the battle isDemo flag
   *
   * @param battleId ID of the battle to edit
   * @param isDemo New value for the isDemo flag
   */
  async editBattle({
    battleId,
    isDemo,
  }: {
    battleId: string;
    isDemo: boolean;
  }) {
    await db
      .update(schema.battles)
      .set({ isDemo })
      .where(eq(schema.battles.id, battleId))
      .execute();
  }

  /**
   * Updates the battle label (owner or admin only)
   *
   * @param battleId ID of the battle to update
   * @param label New label for the battle
   * @param sessionId Session ID of the user making the request
   * @param isAdmin Whether the user is an admin
   */
  async updateBattleLabel({
    battleId,
    label,
    sessionId,
    isAdmin,
  }: {
    battleId: string;
    label: string;
    sessionId?: string;
    isAdmin?: boolean;
  }) {
    // Get the battle to check ownership
    const battle = await db.query.battles.findFirst({
      where: eq(schema.battles.id, battleId),
    });

    if (!battle) {
      throw new Error(`Battle ${battleId} not found`);
    }

    // Check if the user is the owner or an admin
    const isOwner = sessionId && battle.sessionId === sessionId;
    if (!isOwner && !isAdmin) {
      throw new Error("You don't have permission to edit this battle");
    }

    await db
      .update(schema.battles)
      .set({ label })
      .where(eq(schema.battles.id, battleId))
      .execute();

    return { success: true };
  }

  /**
   * Get battle query results
   */
  async getBattleQueryResults(battleId: string, sessionId?: string) {
    // First get the battle to get database IDs
    const battle = await db.query.battles.findFirst({
      where: eq(schema.battles.id, battleId),
    });

    if (!battle) {
      throw new Error(`Battle ${battleId} not found`);
    }

    // If sessionId is provided and battle has a sessionId, verify they match
    if (sessionId && battle.sessionId && battle.sessionId !== sessionId) {
      throw new Error(`Battle ${battleId} not found`);
    }

    const queries = await db.query.battleQueries.findMany({
      where: eq(schema.battleQueries.battleId, battleId),
      with: {
        results: {
          with: {
            database: true,
          },
        },
      },
    });

    return queries.map((query) => {
      // Use configIndex to differentiate results (supports self-battles with different configs)
      const db1Result = query.results.find((r) => r.configIndex === 1);
      const db2Result = query.results.find((r) => r.configIndex === 2);

      return {
        queryId: query.id,
        queryText: query.queryText,
        database1: {
          id: battle.databaseId1,
          score: db1Result?.score || null,
          results: db1Result?.results || [],
          feedback: db1Result?.llmFeedback || null,
        },
        database2: {
          id: battle.databaseId2,
          score: db2Result?.score || null,
          results: db2Result?.results || [],
          feedback: db2Result?.llmFeedback || null,
        },
      };
    });
  }
}
