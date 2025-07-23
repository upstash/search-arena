import {
  SearchProvider,
  SearchResult,
  UpstashSearchCredentials,
} from "./types";
import { Search } from "@upstash/search";

export class UpstashSearchProvider implements SearchProvider {
  private credentials: UpstashSearchCredentials;
  name = "upstash_search";

  constructor(credentials: UpstashSearchCredentials) {
    this.credentials = credentials;
  }

  async search(query: string): Promise<SearchResult[]> {
    try {
      // Initialize the Upstash Search client
      const client = new Search({
        url: this.credentials.url,
        token: this.credentials.token,
      });

      // Access the specified index
      const index = client.index<{ title: string; description: string }>(
        this.credentials.index
      );

      // Perform the search
      const searchResults = await index.search({
        query,
        limit: 10,
        reranking: true,
      });

      // Transform Upstash search results to the common SearchResult format
      return searchResults.map((result) => {
        // Extract the document content and metadata
        const { id, content, score } = result;

        return {
          id,
          title: content.title ?? "Untitled",
          description: content.description ?? "No description available",
          score: score || 0,
        };
      });
    } catch (error) {
      console.error("Error searching Upstash:", error);
      throw new Error(
        `Upstash search failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
