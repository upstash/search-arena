#!/usr/bin/env ts-node
/**
 * Migration script to transfer data from Algolia to Upstash Search
 *
 * Usage:
 * 1. Make sure you have the required environment variables set:
 *    - ALGOLIA_APPLICATION_ID
 *    - ALGOLIA_API_KEY
 *    - ALGOLIA_INDEX
 *    - UPSTASH_URL
 *    - UPSTASH_TOKEN
 *    - UPSTASH_INDEX
 *
 * 2. Run the script:
 *    ts-node scripts/migrate-algolia-to-upstash.ts
 */

// Using require instead of import for compatibility with ts-node
import { algoliasearch } from "algoliasearch";
import { Search } from "@upstash/search";
import dotenv from "dotenv";
import { exit } from "process";

// Load environment variables
dotenv.config();

// Validate environment variables
const requiredEnvVars = [
  "ALGOLIA_APPLICATION_ID",
  "ALGOLIA_API_KEY",
  "ALGOLIA_INDEX",
  "UPSTASH_URL",
  "UPSTASH_TOKEN",
  "UPSTASH_INDEX",
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

// Initialize Algolia client
const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APPLICATION_ID!,
  process.env.ALGOLIA_API_KEY!
);

// Initialize Upstash Search client
const upstashClient = new Search({
  url: process.env.UPSTASH_URL!,
  token: process.env.UPSTASH_TOKEN!,
});

// Define the type for Algolia hits
interface AlgoliaHit {
  objectID: string;
  title?: string;
  description?: string;
  content?: string;
  [key: string]: unknown;
}

// Define the type for Upstash content
interface UpstashContent {
  title: string;
  description: string;
  [key: string]: unknown;
}

// Define the migration function
async function migrateData() {
  try {
    console.log("Starting migration from Algolia to Upstash Search...");

    // Get the Upstash index
    const upstashIndex = upstashClient.index(process.env.UPSTASH_INDEX!);

    // Batch size for processing records
    const BATCH_SIZE = 1000;
    let hasMore = true;
    let page = 0;
    let totalMigrated = 0;

    // Process records in batches
    while (hasMore) {
      console.log(`Fetching batch ${page + 1}...`);
      // Get records from Algolia using the multi-index search API
      const { hits, nbPages } = await algoliaClient.browse({
        indexName: process.env.ALGOLIA_INDEX!,
        browseParams: {
          page: page,
          hitsPerPage: BATCH_SIZE,
        },
      });
      console.log("Got ", hits.length, "elements.", "nbPages", nbPages);

      // console.log(hits.at(0));
      // exit();

      // Get the hits from the first result
      // Need to use type assertion since the Algolia types are complex

      if (hits.length === 0) {
        console.log("No more records to process.");
        hasMore = false;
        break;
      }

      console.log(`Processing ${hits.length} records...`);

      // Transform Algolia records to Upstash format
      const upstashRecords = hits.map((hit) => {
        // Extract the objectID as the document ID
        const id = hit.objectID;

        // Create content object with title and description
        const content = {
          title: hit.title,
          description: hit.overview,
          cast: hit.cast,
          crew: hit.crew,
          genres: hit.genres,
          keywords: hit.keywords,
        };

        // Return the document in Upstash format
        return {
          id,
          content,
        };
      });

      // Upload records to Upstash in smaller chunks to avoid rate limits
      const UPLOAD_CHUNK_SIZE = 100;
      for (let i = 0; i < upstashRecords.length; i += UPLOAD_CHUNK_SIZE) {
        const chunk = upstashRecords.slice(i, i + UPLOAD_CHUNK_SIZE);
        console.log(
          `Uploading chunk ${Math.floor(i / UPLOAD_CHUNK_SIZE) + 1} of ${Math.ceil(upstashRecords.length / UPLOAD_CHUNK_SIZE)}...`
        );

        // exit();
        await upstashIndex.upsert(chunk);
        totalMigrated += chunk.length;

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      hasMore = nbPages ? page < nbPages - 1 : false;
      page++;

      console.log(
        `Completed batch ${page}. Total migrated so far: ${totalMigrated}`
      );
    }

    console.log(
      `Migration completed successfully! Total records migrated: ${totalMigrated}`
    );
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

// Run the migration
migrateData();
