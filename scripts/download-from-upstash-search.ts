#!/usr/bin/env bun
/**
 * Script to download all documents from an Upstash Search index using the range command
 * and save them to a JSON file.
 *
 * Required environment variables:
 *   - UPSTASH_SEARCH_REST_URL: The Upstash Search REST URL
 *   - UPSTASH_SEARCH_REST_TOKEN: The Upstash Search REST token
 *   - UPSTASH_SEARCH_INDEX: The name of the index to download from
 *
 * Usage: bun run scripts/download-from-upstash-search.ts
 */

import { Search } from "@upstash/search";
import { writeFileSync } from "fs";
import { resolve } from "path";

// Validate required environment variables
const requiredEnvVars = [
  "UPSTASH_SEARCH_REST_URL",
  "UPSTASH_SEARCH_REST_TOKEN",
  "UPSTASH_SEARCH_INDEX",
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    `Error: Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

// Initialize Upstash Search client using fromEnv (reads UPSTASH_SEARCH_REST_URL and UPSTASH_SEARCH_REST_TOKEN)
const client = Search.fromEnv();
const index = client.index(process.env.UPSTASH_SEARCH_INDEX!);

// Output file path
const outputPath = resolve(
  // @ts-ignore
  import.meta.dir,
  `../dataset/${process.env.UPSTASH_SEARCH_INDEX}-export.json`
);

interface Document {
  id: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

async function downloadAllDocuments(): Promise<Document[]> {
  const allDocuments: Document[] = [];
  let cursor = "0";
  const BATCH_SIZE = 100;
  let batchCount = 0;

  console.log(`Starting download from index: ${process.env.UPSTASH_SEARCH_INDEX}`);

  while (true) {
    batchCount++;
    console.log(`Fetching batch ${batchCount} (cursor: ${cursor})...`);

    const response = await index.range({
      cursor,
      limit: BATCH_SIZE,
    });

    const documents = response.documents as Document[];
    allDocuments.push(...documents);

    console.log(
      `  Retrieved ${documents.length} documents (total: ${allDocuments.length})`
    );

    // Check if we've reached the end
    if (!response.nextCursor || response.nextCursor === "0") {
      console.log("Reached end of index.");
      break;
    }

    cursor = response.nextCursor;

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allDocuments;
}

async function main() {
  try {
    const documents = await downloadAllDocuments();

    console.log(`\nTotal documents downloaded: ${documents.length}`);

    // Write to JSON file
    const jsonContent = JSON.stringify(documents, null, 2);
    writeFileSync(outputPath, jsonContent, "utf-8");

    console.log(`Successfully saved to: ${outputPath}`);
    console.log(`File size: ${jsonContent.length} bytes`);
  } catch (error) {
    console.error("Error downloading documents:", error);
    process.exit(1);
  }
}

main();
