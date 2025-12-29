import { z } from "zod";
import { PROVIDERS } from "@/lib/providers";
import { SearchProvider, SearchResponse } from "./types";
import { algoliasearch } from "algoliasearch";
import { createFetchRequester } from "@algolia/requester-fetch";

// Types derived from PROVIDERS registry - kept private to this file
type AlgoliaCredentials = z.infer<typeof PROVIDERS.algolia.credentialsSchema>;
type AlgoliaSearchConfig = z.infer<typeof PROVIDERS.algolia.searchConfigSchema>;

export class AlgoliaSearchProvider implements SearchProvider {
  private credentials: AlgoliaCredentials;
  private config: AlgoliaSearchConfig;
  name = "algolia";

  constructor(credentials: AlgoliaCredentials, config: AlgoliaSearchConfig) {
    this.credentials = credentials;
    this.config = config;
  }

  async search(query: string): Promise<SearchResponse> {
    try {
      // Initialize the Algolia client with application ID and API key
      const client = algoliasearch(
        this.credentials.applicationId,
        this.credentials.apiKey,
        {
          requester: createFetchRequester(),
        }
      );

      // Use index from config, or fall back to defaultIndex from credentials
      const indexName = this.config.index ?? this.credentials.defaultIndex;

      // Define the type for search hits
      interface AlgoliaHit {
        id: number;
        objectID?: string;
        title?: string;
        overview?: string;
        description?: string;
        content?: string;
      }

      // Perform the search using client.search
      const { results: searchResults } = await client.search({
        requests: [
          {
            indexName,
            query,
            hitsPerPage: this.config.hitsPerPage,
          },
        ],
      });

      // Transform Algolia results to the common SearchResult format
      // Get hits from the first result
      // TypeScript needs a type assertion here
      const firstResult = searchResults[0] as {
        hits?: Array<Record<string, unknown>>;
        processingTimeMS?: number;
      };
      const hits = firstResult?.hits || [];

      // @ts-expect-error alksjdalksjd
      const results = hits.map((hit: AlgoliaHit) => {
        return {
          id: hit.objectID ?? String(hit.id ?? "unknown"),
          title: hit.title ?? "Untitled",
          description:
            hit.overview ??
            hit.description ??
            hit.content ??
            "No description available",
        };
      });

      // Return results with metadata
      return {
        results,
        metadata: {
          totalResults: hits.length,
          processingTime: firstResult?.processingTimeMS,
          hitsPerPage: this.config.hitsPerPage,
          index: indexName,
        },
      };
    } catch (error) {
      console.error("Error searching Algolia:", error);
      throw new Error(
        `Algolia search failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
