import {
  SearchProvider,
  SearchResponse,
  UpstashSearchCredentials,
} from "./types";

const UPSTASH_SYSTEM_PROMPT_VERCEL = `
# Query Amplification for Vector Search inside Vercel Docs

## Purpose
This tool enhances vector search accuracy by expanding user queries with relevant terms while correcting spelling errors.
The database records are documentations for Vercel products and services.

## Instructions
Given a user query and the category of database records, you will:
1. Correct any spelling errors in the query
2. Generate the query in both lowercase and title case formats
3. Add up to 3 highly relevant synonyms or similar words
4. Return only the results separated by commas

## Input Format
Query: [user's original query with possible spelling errors]

## Output Format
Return a comma-separated list containing:
- The spelling-corrected query in the lowercase
- The spelling-corrected query in the title case
- List of up to 3 relevant synonyms or similar words

## Examples

### Example 1:
Query: cron

**Output:**
Cron, scheduled tasks, job scheduler

### Example 2:
Query: healty recipies for breackfast

**Output:**
healthy recipes for breakfast, Healthy Recipes For Breakfast, nutritious breakfast ideas, morning meal plans, breakfast dishes

### Example 3:
Query: javascript asnyc funtion

**Output:**
javascript async function, Javascript Async Function, javascript promises, asynchronous programming, javascript await

### Example 4:
Query: morgage interest rates

**Output:**
mortgage interest rates, Mortgage Interest Rates, home loan rates, mortgage financing, lending rates

Remember to:
- Prioritize synonyms that would likely appear in relevant documents
- Consider the category context when selecting similar terms
- Choose terms that would improve vector search recall without diluting precision
- Ensure all spelling corrections maintain the original meaning of the query
`;

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

      // Use the configured semantic weight value
      const semanticWeight = this.credentials.semanticWeight;

      // Prepare the request body
      const requestBody = {
        query,
        topK: this.credentials.topk,
        includeMetadata: true,
        reranking: this.credentials.reranking,
        inputEnrichment: this.credentials.inputEnrichment,
        semanticWeight,
        _returnEnrichedInput: true,

        // Append the original input to the enrichment result
        _appendOriginalInputToEnrichmentResult: true,
        _systemPrompt: UPSTASH_SYSTEM_PROMPT_VERCEL,
        // Query: %2\$s\nCategory: %1\$s
        // _userPromptTemplate: "Query: %2\\$s",
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
        const text = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, data:\n${text}`
        );
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
      const results = upstashResults
        .map((result) => {
          // Use the parsed content object instead of the raw data string
          const { id, content, score } = result;

          return {
            id,
            title: content?.title ?? "Untitled",
            description: content?.description ?? "No description available",
            score: score || 0,
          };
        })
        // When reranking is enabled, filter out results with a score less than 0.1
        .filter((result) =>
          this.credentials.reranking ? result.score > 0.1 : true
        );

      // Return results with metadata
      return {
        results,
        metadata: {
          enrichedInput: decodedEnrichedInput,
          totalResults: upstashResults.length,
          topk: this.credentials.topk,
          reranking: this.credentials.reranking,
          inputEnrichment: this.credentials.inputEnrichment,
          semanticWeight: semanticWeight,
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
