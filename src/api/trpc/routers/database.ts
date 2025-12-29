import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import {
  upstashCredentialsSchema,
  algoliaCredentialsSchema,
} from "@/lib/schemas/credentials";

// Input validation schemas
const createDatabaseSchema = z.object({
  label: z.string().min(1),
  provider: z.enum(["algolia", "upstash_search"]),
  // Credentials as JSON string - validated based on provider
  credentials: z.string().min(1),
  devOnly: z.boolean().default(true),
});

export type CreateDatabaseInput = z.infer<typeof createDatabaseSchema>;

const updateDatabaseSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).optional(),
  credentials: z.string().optional(),
  devOnly: z.boolean().optional(),
});

// Helper to validate credentials JSON based on provider
function validateCredentials(
  provider: "algolia" | "upstash_search",
  credentialsJson: string
): void {
  try {
    const parsed = JSON.parse(credentialsJson);
    if (provider === "upstash_search") {
      upstashCredentialsSchema.parse(parsed);
    } else if (provider === "algolia") {
      algoliaCredentialsSchema.parse(parsed);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON format for credentials");
    }
    throw error;
  }
}

// Database router
export const databaseRouter = router({
  // Get all databases
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.databaseService.getAllDatabases({
      includeCredentials: ctx.isAdmin,
      isAdmin: ctx.isAdmin,
    });
  }),

  // Get database by ID
  getById: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.databaseService.getDatabaseById(input.id);
    }),

  // Create a new database (v1 with JSON credentials)
  create: protectedProcedure
    .input(createDatabaseSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate credentials JSON against Zod schema
      validateCredentials(input.provider, input.credentials);

      return ctx.databaseService.createDatabase(
        input.label,
        input.provider,
        input.credentials,
        input.devOnly
      );
    }),

  // Update a database
  update: protectedProcedure
    .input(updateDatabaseSchema)
    .mutation(async ({ ctx, input }) => {
      // If credentials are provided, validate them
      if (input.credentials) {
        // Get the database to know its provider
        const db = await ctx.databaseService.getDatabaseById(input.id);
        if (db) {
          validateCredentials(db.provider, input.credentials);
        }
      }

      return ctx.databaseService.updateDatabase(input.id, {
        label: input.label,
        credentials: input.credentials,
        devOnly: input.devOnly,
      });
    }),

  // Duplicate a database
  duplicate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.databaseService.duplicateDatabase(input.id);
    }),

  // Delete a database
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.databaseService.deleteDatabase(input.id);
    }),

  // Test database connection
  testConnection: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.databaseService.testDatabaseConnection(input.id);
    }),
});
