import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  pgEnum,
  decimal,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Provider types enum
export const providerEnum = pgEnum("provider_type", [
  "algolia",
  "upstash_search",
]);

export const battleStatusEnum = pgEnum("battle_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
]);

// Database table
export const databases = pgTable("databases", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: varchar("label", { length: 255 }).notNull(),
  provider: providerEnum("provider").notNull(),
  // Credentials stored as environment file format
  credentials: text("credentials").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Battle table
export const battles = pgTable("battles", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: varchar("label", { length: 255 }).notNull(),
  databaseId1: uuid("database_id_1")
    .notNull()
    .references(() => databases.id, { onDelete: "cascade" }),
  databaseId2: uuid("database_id_2")
    .notNull()
    .references(() => databases.id, { onDelete: "cascade" }),
  queries: text("queries").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  status: battleStatusEnum("status").default("pending").notNull(),
  // Error message if status is "failed"
  error: text("error"),
  meanScoreDb1: decimal("mean_score_db1", { precision: 4, scale: 2 }),
  meanScoreDb2: decimal("mean_score_db2", { precision: 4, scale: 2 }),
});

// Battle queries table
export const battleQueries = pgTable("battle_queries", {
  id: uuid("id").primaryKey().defaultRandom(),
  battleId: uuid("battle_id")
    .notNull()
    .references(() => battles.id, { onDelete: "cascade" }),
  queryText: text("query_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Search results table
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
    results: jsonb("results").notNull(),
    score: decimal("score", { precision: 4, scale: 2 }),
    llmFeedback: text("llm_feedback"),
    // Timing information in milliseconds
    searchDuration: decimal("search_duration", { precision: 8, scale: 2 }),
    llmDuration: decimal("llm_duration", { precision: 8, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      unq: unique().on(table.battleQueryId, table.databaseId),
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

// Types for better type safety
export type Database = typeof databases.$inferSelect;
export type NewDatabase = typeof databases.$inferInsert;

export type Battle = typeof battles.$inferSelect;
export type NewBattle = typeof battles.$inferInsert;

export type BattleQuery = typeof battleQueries.$inferSelect;
export type NewBattleQuery = typeof battleQueries.$inferInsert;

export type SearchResult = typeof searchResults.$inferSelect;
export type NewSearchResult = typeof searchResults.$inferInsert;
