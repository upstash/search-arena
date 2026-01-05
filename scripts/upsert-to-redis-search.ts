#!/usr/bin/env bun
/**
 * Script to upsert data from a JSON file to Upstash Redis Search
 *
 * Usage:
 * 1. Make sure you have the required environment variables set in .env:
 *    - UPSTASH_REDIS_URL
 *    - UPSTASH_REDIS_TOKEN
 *    - UPSTASH_REDIS_INDEX
 *
 * 2. Run the script with the path to your JSON file:
 *    bun run scripts/upsert-to-redis-search.ts ./data.json
 *
 * JSON file format:
 * [
 *   { "key": "user:1", "title": "...", "description": "...", ... },
 *   { "key": "user:2", "title": "...", "description": "...", ... }
 * ]
 *
 * Each item must have a "key" field that will be used as the Redis key.
 * The rest of the fields will be stored as JSON.
 */

import { Redis, s } from "@upstash/redis";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load environment variables (bun automatically loads .env)

// Validate environment variables
const requiredEnvVars = [
  "UPSTASH_REDIS_URL",
  "UPSTASH_REDIS_TOKEN",
  "UPSTASH_REDIS_INDEX",
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    `Error: Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  console.error("\nPlease set the following in your .env file:");
  console.error("  UPSTASH_REDIS_URL=https://your-redis.upstash.io");
  console.error("  UPSTASH_REDIS_TOKEN=your-redis-token");
  console.error("  UPSTASH_REDIS_INDEX=your-search-index-name");
  process.exit(1);
}

// Get the JSON file path from command line arguments
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error("Error: Please provide the path to the JSON file");
  console.error("Usage: bun run scripts/upsert-to-redis-search.ts ./data.json");
  process.exit(1);
}

const resolvedPath = resolve(jsonFilePath);

if (!existsSync(resolvedPath)) {
  console.error(`Error: File not found: ${resolvedPath}`);
  process.exit(1);
}

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const indexName = process.env.UPSTASH_REDIS_INDEX!;

// Define the schema for the search index
const schema = s.object({
  title: s.string(),
  description: s.string(),
});

console.log("schema is", JSON.stringify(schema))

// Define the type for data items
interface DataItem {
  key: string;
  title?: string;
  description?: string;
  [key: string]: unknown;
}

async function upsertData() {
  try {
    console.log(`Reading JSON file from: ${resolvedPath}`);

    // Read and parse the JSON file
    const fileContent = readFileSync(resolvedPath, "utf-8");
    const data: DataItem[] = JSON.parse(fileContent);

    if (!Array.isArray(data)) {
      console.error("Error: JSON file must contain an array of objects");
      process.exit(1);
    }

    console.log(`Found ${data.length} records to upsert`);

    // Validate that all items have a key field
    const invalidItems = data.filter((item) => !item.key);
    if (invalidItems.length > 0) {
      console.error(
        `Error: ${invalidItems.length} items are missing the required "key" field`
      );
      process.exit(1);
    }

    // Check if index exists, if not create it
    const index = redis.search.index(indexName, schema);
    const indexInfo = await index.describe();


    if (indexInfo.name) {
      console.log("Old index found:", indexInfo);
      console.log(`Deleting index ${indexName}`);
      await index.drop()
    }
    console.log(`Creating search index: ${indexName}`);
    await redis.search.createIndex({
      dataType: "string",
      prefix: "movie:",
      name: indexName,
      schema: schema,
    });
    console.log("Index created successfully:", await index.describe());

    // Upsert data in batches
    const BATCH_SIZE = 500;
    let totalUpserted = 0;

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(data.length / BATCH_SIZE)}...`
      );

      // Create a map of key -> JSON string for mset
      const msetData: Record<string, string> = {};
      for (const item of batch) {
        const { key, ...rest } = item;
        msetData[key] = JSON.stringify(rest);
      }

      // Use mset to upsert all items in the batch
      await redis.mset(msetData);
      totalUpserted += batch.length;

      console.log(`  Upserted ${batch.length} records. Total: ${totalUpserted}`);

      // Small delay to avoid rate limits
      if (i + BATCH_SIZE < data.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Wait for indexing to complete
    console.log("Waiting for indexing to complete...");
    await index.waitIndexing();

    console.log(
      `\nUpsert completed successfully! Total records upserted: ${totalUpserted}`
    );

    // Verify with a quick query
    const verifyResult = await index.query();
    console.log(`Verification: Index now contains approximately ${verifyResult.length} searchable records`);

  } catch (error) {
    console.error("Error during upsert:", error);
    process.exit(1);
  }
}

// Run the upsert
upsertData();
