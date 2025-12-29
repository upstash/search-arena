import {
  UpstashCredentials,
  AlgoliaCredentials,
} from "@/lib/schemas/credentials";
import {
  UpstashSearchConfig,
  AlgoliaSearchConfig,
} from "@/lib/schemas/search-config";

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

// Provider parameters for creating search providers
export type UpstashProviderParams = {
  provider: "upstash_search";
  credentials: UpstashCredentials;
  config: UpstashSearchConfig;
};

export type AlgoliaProviderParams = {
  provider: "algolia";
  credentials: AlgoliaCredentials;
  config: AlgoliaSearchConfig;
};

export type ProviderParams = UpstashProviderParams | AlgoliaProviderParams;

// Re-export credential and config types for convenience
export type { UpstashCredentials, AlgoliaCredentials };
export type { UpstashSearchConfig, AlgoliaSearchConfig };
