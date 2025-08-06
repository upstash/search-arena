import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { createSearchProvider } from "../providers";

export class DatabaseService {
  /**
   * Get all databases
   */
  async getAllDatabases({
    includeCredentials = false,
  }: {
    includeCredentials?: boolean;
  }) {
    const result = await db.query.databases.findMany({
      orderBy: (databases, { asc }) => [asc(databases.label)],
    });

    return result.map((database) => ({
      ...database,
      credentials: includeCredentials ? database.credentials : undefined,
    }));
  }

  /**
   * Get database by ID with credentials
   */
  async getDatabaseById(id: string) {
    return db.query.databases.findFirst({
      where: eq(schema.databases.id, id),
    });
  }

  /**
   * Create a new database
   */
  async createDatabase(
    label: string,
    provider: "algolia" | "upstash_search",
    credentials: string
  ) {
    // Create the database record with credentials
    const [database] = await db
      .insert(schema.databases)
      .values({
        label,
        provider,
        credentials,
      })
      .returning();

    return database;
  }

  /**
   * Update a database
   */
  async updateDatabase(
    id: string,
    data: {
      label?: string;
      credentials?: string;
    }
  ) {
    // Update the database record
    const updateData: Partial<typeof schema.databases.$inferInsert> = {};
    if (data.label) updateData.label = data.label;
    if (data.credentials) updateData.credentials = data.credentials;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.databases)
        .set(updateData)
        .where(eq(schema.databases.id, id))
        .execute();
    }

    // Return the updated database
    return db.query.databases.findFirst({
      where: eq(schema.databases.id, id),
    });
  }

  /**
   * Delete a database
   */
  async deleteDatabase(id: string) {
    await db
      .delete(schema.databases)
      .where(eq(schema.databases.id, id))
      .execute();

    return { success: true };
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection(id: string) {
    try {
      const database = await this.getDatabaseById(id);

      if (!database || !database.credentials) {
        throw new Error("Database or credentials not found");
      }

      // Create the search provider
      const provider = createSearchProvider(
        database.provider,
        database.credentials
      );

      // Test with a simple query
      const results = await provider.search("test");

      return {
        success: true,
        resultsCount: results.length,
      };
    } catch (error) {
      console.error("Error testing database connection:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
