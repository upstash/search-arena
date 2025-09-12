import { AlgoliaCredentials, SearchProvider, SearchResponse } from "./types";
import { algoliasearch } from "algoliasearch";
import { createFetchRequester } from "@algolia/requester-fetch";

export class AlgoliaSearchProvider implements SearchProvider {
  private credentials: AlgoliaCredentials;
  name = "algolia";

  constructor(credentials: AlgoliaCredentials) {
    this.credentials = credentials;
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
            indexName: this.credentials.index,
            query,
            hitsPerPage: 10,
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
