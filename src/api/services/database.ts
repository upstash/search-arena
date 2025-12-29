import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { createSearchProvider } from "../providers";
import {
  parseCredentials,
} from "@/lib/schemas/credentials";
import {
  getDefaultConfig,
} from "@/lib/schemas/search-config";

export class DatabaseService {
  /**
   * Get all databases
   */
  async getAllDatabases({
    includeCredentials = false,
    isAdmin = false,
  }: {
    includeCredentials?: boolean;
    isAdmin?: boolean;
  }) {
    const result = await db.query.databases.findMany({
      orderBy: (databases, { asc }) => [asc(databases.label)],
    });

    // Always filter out v0 databases, and for non-admins only show public databases
    const filteredResult = result.filter((db) => {
      // Always exclude v0 (legacy) databases
      if (db.version === 0) return false;
      // For non-admins, only show public databases (devOnly === false)
      if (!isAdmin && db.devOnly) return false;
      return true;
    });

    return filteredResult.map((database) => ({
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
   * Create a new database (v1 with JSON credentials)
   */
  async createDatabase(
    label: string,
    provider: "algolia" | "upstash_search",
    credentials: string,
    devOnly: boolean = true
  ) {
    // Create the database record with credentials and version=1
    const [database] = await db
      .insert(schema.databases)
      .values({
        label,
        provider,
        credentials,
        version: 1, // New format
        devOnly,
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
      devOnly?: boolean;
    }
  ) {
    // Update the database record
    const updateData: Partial<typeof schema.databases.$inferInsert> = {};
    if (data.label) updateData.label = data.label;
    if (data.credentials) {
      updateData.credentials = data.credentials;
      updateData.version = 1; // Upgrading to v1 format
    }
    if (data.devOnly !== undefined) updateData.devOnly = data.devOnly;

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
   * Duplicate a database
   */
  async duplicateDatabase(id: string) {
    // Get the original database
    const originalDatabase = await this.getDatabaseById(id);

    if (!originalDatabase) {
      throw new Error("Database not found");
    }

    // Create a new database with the same configuration but a new label
    const duplicatedLabel = `${originalDatabase.label} (Copy)`;

    const [duplicatedDatabase] = await db
      .insert(schema.databases)
      .values({
        label: duplicatedLabel,
        provider: originalDatabase.provider,
        credentials: originalDatabase.credentials,
        version: originalDatabase.version,
        devOnly: originalDatabase.devOnly,
      })
      .returning();

    return duplicatedDatabase;
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

      // Only v1 databases can be tested
      if (database.version !== 1) {
        throw new Error("Cannot test v0 (legacy) database. Please update credentials to JSON format.");
      }

      // Parse credentials and use default config
      const credentials = parseCredentials(database.provider, database.credentials);
      const config = getDefaultConfig(database.provider);

      // Create the search provider with new API
      const provider = createSearchProvider({
        provider: database.provider,
        credentials,
        config,
      } as Parameters<typeof createSearchProvider>[0]);

      // Test with a simple query
      const results = await provider.search("test");

      return {
        success: true,
        resultsCount: results.results.length,
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
