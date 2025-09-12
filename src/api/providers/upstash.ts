import {
  SearchProvider,
  SearchResponse,
  UpstashSearchCredentials,
} from "./types";

export class UpstashSearchProvider implements SearchProvider {
  private credentials: UpstashSearchCredentials;
  name = "upstash_search";

  constructor(credentials: UpstashSearchCredentials) {
    this.credentials = credentials;
  }

  async search(query: string): Promise<SearchResponse> {
    try {
      // Construct the search URL
      const searchUrl = `${this.credentials.url}/search/${this.credentials.index}`;

      // Prepare the request body
      const requestBody = {
        query,
        topK: 10,
        includeMetadata: true,
        reranking: this.credentials.reranking,
        _returnEnrichedInput: true,
      };

      // Make the fetch request
      const response = await fetch(searchUrl, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.credentials.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the enriched input header
      const enrichedInput = response.headers.get(
        "Upstash-Vector-Enriched-Input"
      );
      const decodedEnrichedInput = enrichedInput
        ? decodeURIComponent(enrichedInput)
        : undefined;

      if (decodedEnrichedInput) {
        console.log("Upstash-Vector-Enriched-Input:", decodedEnrichedInput);
      }

      const data = await response.json();

      type UpstashSearchResult = {
        id: string;
        data: string; // JSON string
        content: {
          title: string;
          description: string;
          [key: string]: unknown;
        };
        score: number;
      };
      const upstashResults = data.result as UpstashSearchResult[];

      // Transform Upstash search results to the common SearchResult format
      const results = upstashResults.map((result) => {
        // Use the parsed content object instead of the raw data string
        const { id, content, score } = result;

        return {
          id,
          title: content?.title ?? "Untitled",
          description: content?.description ?? "No description available",
          score: score || 0,
        };
      });

      // Return results with metadata
      return {
        results,
        metadata: {
          enrichedInput: decodedEnrichedInput,
          totalResults: upstashResults.length,
        },
      };
    } catch (error) {
      console.error("Error searching Upstash:", error);
      throw new Error(
        `Upstash search failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
