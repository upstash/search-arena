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
      const index = redis.search.index(indexName);

      // Perform the search query with fuzzy matching on title and phrase matching on description
      const res = await index.query({
        filter: {
          title: {
            $fuzzy: {
              value: query,
              distance: 3,
            },
            $boost: 2,
          },
          description: {
            $phrase: query,
          },
        },
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
