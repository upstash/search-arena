import {
  SearchProvider,
  SearchResponse,
  UpstashCredentials,
  UpstashSearchConfig,
} from "./types";

export class UpstashSearchProvider implements SearchProvider {
  private credentials: UpstashCredentials;
  private config: UpstashSearchConfig;
  name = "upstash_search";

  constructor(credentials: UpstashCredentials, config: UpstashSearchConfig) {
    this.credentials = credentials;
    this.config = config;
  }

  async search(query: string): Promise<SearchResponse> {
    try {
      // Use namespace from config, or fall back to defaultNamespace from credentials
      const namespace = this.config.namespace ?? this.credentials.defaultNamespace ?? "";
      
      // Construct the search URL with namespace
      const searchUrl = `${this.credentials.url}/search/${namespace}`;

      // Prepare the request body using config values
      const requestBody = {
        query,
        topK: this.config.topK,
        includeMetadata: true,
        reranking: this.config.reranking,
        inputEnrichment: this.config.inputEnrichment,
        semanticWeight: this.config.semanticWeight,
        _returnEnrichedInput: true,
        _appendOriginalInputToEnrichmentResult: true,
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
          topK: this.config.topK,
          reranking: this.config.reranking,
          inputEnrichment: this.config.inputEnrichment,
          semanticWeight: this.config.semanticWeight,
          namespace,
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
