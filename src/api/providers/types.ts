// Common search result interface
export interface SearchResult {
  id: string;
  title: string;
  description: string;
  // url?: string;
  score?: number;
  [key: string]: unknown; // Allow for additional provider-specific fields
}

// Common search provider interface
export interface SearchProvider {
  search(query: string): Promise<SearchResult[]>;
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
}
