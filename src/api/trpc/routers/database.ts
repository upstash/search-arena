import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { PROVIDERS, PROVIDER_KEYS, isValidProvider } from "@/lib/providers";

// Credentials schema - union of all provider credentials from PROVIDERS registry
const credentialsSchema = z.union(
  Object.values(PROVIDERS).map((val) => val.credentialsSchema),
);

// Input validation schemas
const createDatabaseSchema = z.object({
  label: z.string().min(1),
  // Provider is a string, validated against PROVIDER_KEYS
  provider: z.enum(PROVIDER_KEYS).refine(isValidProvider, {
    message: `Provider must be one of: ${PROVIDER_KEYS.join(", ")}`,
  }),
  // Credentials as JSON object, validated with provider schemas
  credentials: credentialsSchema,
  devOnly: z.boolean().default(true),
});

const updateDatabaseSchema = z.object({
  id: z.uuid(),
  label: z.string().min(1).optional(),
  // Credentials as JSON object - validated with provider schemas if provided
  credentials: credentialsSchema.optional(),
  devOnly: z.boolean().optional(),
});

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
      return ctx.databaseService.createDatabase(
        input.label,
        input.provider,
        // Stringify for storage since service expects JSON string
        JSON.stringify(input.credentials),
        input.devOnly,
      );
    }),

  // Update a database
  update: protectedProcedure
    .input(updateDatabaseSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.databaseService.updateDatabase(input.id, {
        label: input.label,
        // Stringify for storage since service expects JSON string
        credentials: input.credentials
          ? JSON.stringify(input.credentials)
          : undefined,
        devOnly: input.devOnly,
      });
    }),

  // Duplicate a database
  duplicate: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.databaseService.duplicateDatabase(input.id);
    }),

  // Delete a database
  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.databaseService.deleteDatabase(input.id);
    }),

  // Test database connection
  testConnection: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.databaseService.testDatabaseConnection(input.id);
    }),
});
