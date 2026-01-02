import { PROVIDER_KEYS } from "@/lib/providers";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  decimal,
  pgEnum,
  index,
  jsonb,
  unique,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const battleStatusEnum = pgEnum("battle_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
]);

export const providerEnum = pgEnum("provider_type", PROVIDER_KEYS);

// Database table
export const databases = pgTable("databases", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: varchar("label", { length: 255 }).notNull(),
  // Provider is a string, validated at application level via PROVIDERS registry
  provider: providerEnum("provider").notNull(),
  // Credentials stored as JSON string
  credentials: text("credentials").notNull(),
  // Version 0 = legacy ENV format, Version 1 = new JSON format
  version: integer("version").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  devOnly: boolean("dev_only").default(true).notNull(),
});

// Battle table
export const battles = pgTable(
  "battles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: varchar("label", { length: 255 }).notNull(),
    databaseId1: uuid("database_id_1")
      .notNull()
      .references(() => databases.id, { onDelete: "cascade" }),
    databaseId2: uuid("database_id_2")
      .notNull()
      .references(() => databases.id, { onDelete: "cascade" }),
    // Search configs as JSON strings (one per database)
    config1: text("config1"),
    config2: text("config2"),
    queries: text("queries").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
    status: battleStatusEnum("status").default("pending").notNull(),
    // Error message if status is "failed"
    error: text("error"),
    meanScoreDb1: decimal("mean_score_db1", { precision: 4, scale: 2 }),
    meanScoreDb2: decimal("mean_score_db2", { precision: 4, scale: 2 }),
    // Session ID to track user's battles
    sessionId: varchar("session_id", { length: 255 }),
    isDemo: boolean("is_demo").default(false),
    // Number of times to rate each query with the LLM (default 1)
    ratingCount: integer("rating_count").notNull().default(1),
    // Battle metadata (aggregated costs, usage, etc.)
    metadata: jsonb("metadata"),
  },
  (table) => {
    return [
      index("session_id_idx").on(table.sessionId),
      index("is_demo_idx").on(table.isDemo),
    ];
  }
);

// Each battle has a list of queries, example: "romcom movies", "mafia movies"
export const battleQueries = pgTable("battle_queries", {
  id: uuid("id").primaryKey().defaultRandom(),
  battleId: uuid("battle_id")
    .notNull()
    .references(() => battles.id, { onDelete: "cascade" }),
  queryText: text("query_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  error: text("error"),
  // Number of times to rate this query with the LLM (default 1)
  ratingCount: integer("rating_count").notNull().default(1),
});

// Each query has TWO search results, one from each database,
//
// But IF the ratingCount is more than one, then there are ratingCount x 2 search results
// for each query (one per rating attempt per database).
export const searchResults = pgTable(
  "search_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    battleQueryId: uuid("battle_query_id")
      .notNull()
      .references(() => battleQueries.id, { onDelete: "cascade" }),
    databaseId: uuid("database_id")
      .notNull()
      .references(() => databases.id, { onDelete: "cascade" }),
    // Rating index (1, 2, 3...) to differentiate between multiple LLM rating attempts
    ratingIndex: integer("rating_index").notNull().default(1),
    // Config index (1 or 2) to differentiate results when same database is used with different configs
    configIndex: integer("config_index").notNull().default(1),
    results: jsonb("results").notNull(),
    score: decimal("score", { precision: 4, scale: 2 }),
    llmFeedback: text("llm_feedback"),
    // Timing information in milliseconds
    searchDuration: decimal("search_duration", { precision: 8, scale: 2 }),
    llmDuration: decimal("llm_duration", { precision: 8, scale: 2 }),
    // Search metadata (enriched input, processing time, etc.) AND LLM usage/cost info
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      // Include configIndex and ratingIndex in unique constraint
      unq: unique().on(table.battleQueryId, table.databaseId, table.configIndex, table.ratingIndex),
    };
  }
);

// Relations for better type safety
export const databasesRelations = relations(databases, ({ many }) => ({
  battlesAsDb1: many(battles, { relationName: "database1" }),
  battlesAsDb2: many(battles, { relationName: "database2" }),
  searchResults: many(searchResults),
}));

export const battlesRelations = relations(battles, ({ one, many }) => ({
  database1: one(databases, {
    fields: [battles.databaseId1],
    references: [databases.id],
    relationName: "database1",
  }),
  database2: one(databases, {
    fields: [battles.databaseId2],
    references: [databases.id],
    relationName: "database2",
  }),
  queries: many(battleQueries),
}));

export const battleQueriesRelations = relations(
  battleQueries,
  ({ one, many }) => ({
    battle: one(battles, {
      fields: [battleQueries.battleId],
      references: [battles.id],
    }),
    results: many(searchResults),
  })
);

export const searchResultsRelations = relations(searchResults, ({ one }) => ({
  query: one(battleQueries, {
    fields: [searchResults.battleQueryId],
    references: [battleQueries.id],
  }),
  database: one(databases, {
    fields: [searchResults.databaseId],
    references: [databases.id],
  }),
}));

export type BattleQuery = typeof battleQueries.$inferSelect;
