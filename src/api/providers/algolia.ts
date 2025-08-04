import { AlgoliaCredentials, SearchProvider, SearchResult } from "./types";
import { algoliasearch } from "algoliasearch";
import { createFetchRequester } from "@algolia/requester-fetch";

export class AlgoliaSearchProvider implements SearchProvider {
  private credentials: AlgoliaCredentials;
  name = "algolia";

  constructor(credentials: AlgoliaCredentials) {
    this.credentials = credentials;
  }

  async search(query: string): Promise<SearchResult[]> {
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
      }

      // Perform the search using client.search
      const { results } = await client.search({
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
      const firstResult = results[0] as {
        hits?: Array<Record<string, unknown>>;
      };
      const hits = firstResult?.hits || [];

      // @ts-expect-error alksjdalksjd
      return hits.map((hit: AlgoliaHit) => {
        return {
          id: hit.objectID,
          title: hit.title,
          description: hit.overview,
        };
      });
    } catch (error) {
      console.error("Error searching Algolia:", error);
      throw new Error(
        `Algolia search failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
