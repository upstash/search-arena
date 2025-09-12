import { db, schema } from "../db";
import { createSearchProvider } from "../providers";
import { LLMService } from "./llm";
import { and, eq, or } from "drizzle-orm";

export class BattleService {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  /**
   * Creates a new battle between two databases
   */
  async createBattle(
    label: string,
    databaseId1: string,
    databaseId2: string,
    queries: string,
    sessionId?: string
  ) {
    // Create the battle record
    const [battle] = await db
      .insert(schema.battles)
      .values({
        label,
        databaseId1,
        databaseId2,
        status: "pending",
        queries,
        sessionId,
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
            })
            .returning();
          return query;
        })
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

      // Create search providers
      const provider1 = createSearchProvider(
        battle.database1.provider,
        battle.database1.credentials
      );

      const provider2 = createSearchProvider(
        battle.database2.provider,
        battle.database2.credentials
      );

      // Process each query
      let totalScoreDb1 = 0;
      let totalScoreDb2 = 0;

      const searchQuery = async (query: schema.BattleQuery) => {
        // Helper function to search with timing
        const searchWithTiming = async (
          provider: typeof provider1,
          queryText: string
        ) => {
          const start = performance.now();
          const searchResponse = await provider.search(queryText);
          const end = performance.now();
          return {
            searchResponse,
            duration: end - start,
          };
        };

        // Run searches in parallel with individual timing
        const [search1, search2] = await Promise.all([
          searchWithTiming(provider1, query.queryText),
          searchWithTiming(provider2, query.queryText),
        ]);

        console.log(
          "> " + provider1.name,
          search1.searchResponse.results.at(0)
        );
        console.log(
          "> " + provider2.name,
          search2.searchResponse.results.at(0)
        );

        // Evaluate results with LLM (timing is handled inside the LLM service)
        console.log(`Evaluating results for query:`, query.queryText);
        const { db1, db2, llmDuration } =
          await this.llmService.evaluateSearchResults(
            query.queryText,
            search1.searchResponse.results,
            search2.searchResponse.results
          );

        // Store results with timing information
        await db
          .insert(schema.searchResults)
          .values({
            battleQueryId: query.id,
            databaseId: battle.databaseId1,
            results: search1.searchResponse.results,
            score: String(db1.score), // Convert to string for Drizzle compatibility
            llmFeedback: db1.feedback,
            searchDuration: String(search1.duration.toFixed(2)),
            llmDuration: String(llmDuration.toFixed(2)),
            metadata: search1.searchResponse.metadata,
          })
          .execute();

        await db
          .insert(schema.searchResults)
          .values({
            battleQueryId: query.id,
            databaseId: battle.databaseId2,
            results: search2.searchResponse.results,
            score: String(db2.score), // Convert to string for Drizzle compatibility
            llmFeedback: db2.feedback,
            searchDuration: String(search2.duration.toFixed(2)),
            llmDuration: String(llmDuration.toFixed(2)),
            metadata: search2.searchResponse.metadata,
          })
          .execute();

        totalScoreDb1 += db1.score;
        totalScoreDb2 += db2.score;
      };

      await Promise.all(
        queries.map(async (query) => {
          try {
            return await searchQuery(query);
          } catch (error) {
            // Update the query with error
            await db
              .update(schema.battleQueries)
              .set({
                error: String(error),
              })
              .where(eq(schema.battleQueries.id, query.id))
              .execute();
          }
        })
      );

      // Calculate mean scores
      const meanScoreDb1 =
        queries.length > 0 ? totalScoreDb1 / queries.length : 0;
      const meanScoreDb2 =
        queries.length > 0 ? totalScoreDb2 / queries.length : 0;

      // Update battle with results
      await db
        .update(schema.battles)
        .set({
          status: "completed",
          completedAt: new Date(),
          meanScoreDb1: String(meanScoreDb1),
          meanScoreDb2: String(meanScoreDb2),
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
        eq(schema.battles.status, "pending")
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
  async getBattleById(battleId: string) {
    const battle = await db.query.battles.findFirst({
      // For all, battleId is checked
      where: eq(schema.battles.id, battleId),
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
        queries: {
          with: {
            results: true,
          },
        },
      },
    });

    // If battle not found, return null
    if (!battle) throw new Error(`Battle ${battleId} not found`);

    return battle;
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
      // With our improved relations, we no longer need type assertions
      const db1Result = query.results.find(
        (r) => r.databaseId === battle.databaseId1
      );
      const db2Result = query.results.find(
        (r) => r.databaseId === battle.databaseId2
      );

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
