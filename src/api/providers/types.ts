// Common search result interface
export interface SearchResult {
  id: string;
  title: string;
  description: string;
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
