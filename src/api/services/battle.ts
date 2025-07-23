import { db, schema } from "../db";
import { createSearchProvider } from "../providers";
import { LLMService } from "./llm";
import { eq } from "drizzle-orm";

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
    queries: string
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
      })
      .returning();

    // Create battle queries
    const battleQueries = await Promise.all(
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

    // Start the battle process
    this.processBattle(battle.id, battleQueries).catch((error) => {
      console.error(`Error processing battle ${battle.id}:`, error);
      // Update battle status to failed
      db.update(schema.battles)
        .set({ status: "failed" })
        .where(eq(schema.battles.id, battle.id))
        .execute()
        .catch((err) => console.error("Failed to update battle status:", err));
    });

    return battle;
  }

  /**
   * Process a battle asynchronously
   */
  private async processBattle(battleId: string, queries: schema.BattleQuery[]) {
    try {
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
        const [results1, results2] = await Promise.all([
          provider1.search(query.queryText),
          provider2.search(query.queryText),
        ]);

        console.log("> " + provider1.name, results1.at(0));
        console.log("> " + provider2.name, results2.at(0));

        // Evaluate results
        console.log(`Evaluating results for query:`, query.queryText);
        const { db1, db2 } = await this.llmService.evaluateSearchResults(
          query.queryText,
          results1,
          results2
        );

        // Store results
        await db
          .insert(schema.searchResults)
          .values({
            battleQueryId: query.id,
            databaseId: battle.databaseId1,
            results: results1,
            score: String(db1.score), // Convert to string for Drizzle compatibility
            llmFeedback: db1.feedback,
          })
          .execute();

        await db
          .insert(schema.searchResults)
          .values({
            battleQueryId: query.id,
            databaseId: battle.databaseId2,
            results: results2,
            score: String(db2.score), // Convert to string for Drizzle compatibility
            llmFeedback: db2.feedback,
          })
          .execute();

        totalScoreDb1 += db1.score;
        totalScoreDb2 += db2.score;
      };

      await Promise.all(queries.map(searchQuery));

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
        .set({ status: "failed" })
        .where(eq(schema.battles.id, battleId))
        .execute();

      throw error;
    }
  }

  /**
   * Get all battles
   */
  async getAllBattles() {
    return db.query.battles.findMany({
      orderBy: (battles, { desc }) => [desc(battles.createdAt)],
      with: {
        database1: true,
        database2: true,
      },
    });
  }

  /**
   * Get battle details by ID
   */
  async getBattleById(battleId: string) {
    return db.query.battles.findFirst({
      where: eq(schema.battles.id, battleId),
      with: {
        database1: true,
        database2: true,
        queries: {
          with: {
            results: {
              with: {
                database: true,
              },
            },
          },
        },
      },
    });
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

    if (!battle) {
      throw new Error(`Battle ${battleId} not found`);
    }

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

    // Start the battle process
    this.processBattle(battleId, battle.queries).catch((error) => {
      console.error(`Error processing battle ${battleId}:`, error);
      // Update battle status to failed
      db.update(schema.battles)
        .set({ status: "failed" })
        .where(eq(schema.battles.id, battleId))
        .execute()
        .catch((err) => console.error("Failed to update battle status:", err));
    });

    return { success: true };
  }

  /**
   * Get battle query results
   */
  async getBattleQueryResults(battleId: string) {
    // First get the battle to get database IDs
    const battle = await db.query.battles.findFirst({
      where: eq(schema.battles.id, battleId),
    });

    if (!battle) {
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
