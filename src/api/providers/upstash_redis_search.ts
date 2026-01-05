import { z } from "zod";
import { Redis } from "@upstash/redis";
import { PROVIDERS } from "@/lib/providers";
import { SearchProvider, SearchResponse } from "./types";

// Types derived from PROVIDERS registry - kept private to this file
type UpstashRedisSearchCredentials = z.infer<
  typeof PROVIDERS.upstash_redis_search.credentialsSchema
>;
type UpstashRedisSearchConfig = z.infer<
  typeof PROVIDERS.upstash_redis_search.searchConfigSchema
>;

export class UpstashRedisSearchProvider implements SearchProvider {
  private credentials: UpstashRedisSearchCredentials;
  private config: UpstashRedisSearchConfig;
  name = "upstash_redis_search";

  constructor(
    credentials: UpstashRedisSearchCredentials,
    config: UpstashRedisSearchConfig,
  ) {
    this.credentials = credentials;
    this.config = config;
  }

  async search(query: string): Promise<SearchResponse> {
    try {
      // Initialize Redis client
      const redis = new Redis({
        url: this.credentials.url,
        token: this.credentials.token,
      });

      // Use index from config, or fall back to defaultIndex from credentials
      const indexName = this.config.index ?? this.credentials.defaultIndex;
      if (!indexName) throw new Error("No index name provided");
      const index = redis.search.index(indexName);

      // Helper to recursively replace "{{query}}" placeholders with the actual query
      const interpolateQuery = (obj: unknown): unknown => {
        if (typeof obj === "string") {
          return obj === "{{query}}"
            ? query
            : obj.replace(/\{\{query\}\}/g, query);
        }
        if (Array.isArray(obj)) {
          return obj.map(interpolateQuery);
        }
        if (obj && typeof obj === "object") {
          return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, interpolateQuery(v)]),
          );
        }
        return obj;
      };

      // Interpolate {{query}} placeholders in the filter config
      const filter = interpolateQuery(this.config.filter) as any;

      console.log("params", {
        filter,
        limit: this.config.topK,
      });

      // Perform the search query
      const res = await index.query({
        filter,
        limit: this.config.topK,
      });

      // Transform results to the common SearchResult format
      const results = res.map((result) => {
        const data = result.data as { title?: string; description?: string };

        return {
          id: result.key,
          title: data?.title ?? "Untitled",
          description: data?.description ?? "No description available",
          score: result.score ?? 0,
        };
      });

      // Return results with metadata
      return {
        results,
        metadata: {
          totalResults: res.length,
          indexName,
        },
      };
    } catch (error) {
      console.error("Error searching Upstash Redis:", error);
      throw new Error(
        `Upstash Redis search failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
