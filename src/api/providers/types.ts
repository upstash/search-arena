// Common search result interface
export interface SearchResult {
  id: string;
  title: string;
  description: string;
  // url?: string;
  score?: number;
  [key: string]: unknown; // Allow for additional provider-specific fields
}

// Search metadata interface
export interface SearchMetadata {
  enrichedInput?: string;
  totalResults?: number;
  processingTime?: number;
  [key: string]: unknown; // Allow for additional provider-specific metadata
}

// Search response interface
export interface SearchResponse {
  results: SearchResult[];
  metadata: SearchMetadata;
}

// Common search provider interface
export interface SearchProvider {
  search(query: string): Promise<SearchResponse>;
  name: string;
}

// Algolia credentials
export interface AlgoliaCredentials {
  applicationId: string;
  apiKey: string;
  index: string;
}

// Upstash Search credentials
export interface UpstashSearchCredentials {
  url: string;
  token: string;
  index: string;
  reranking: boolean;
  inputEnrichment: boolean;
  topk: number;
  semanticWeight: number;
}
