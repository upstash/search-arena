import { AlgoliaSearchProvider } from "./algolia";
import { UpstashSearchProvider } from "./upstash";
import { SearchProvider, ProviderParams } from "./types";

export * from "./types";
export * from "./algolia";
export * from "./upstash";

// Factory function to create the appropriate search provider
export function createSearchProvider(params: ProviderParams): SearchProvider {
  switch (params.provider) {
    case "algolia":
      return new AlgoliaSearchProvider(params.credentials, params.config);

    case "upstash_search":
      return new UpstashSearchProvider(params.credentials, params.config);

    default:
      throw new Error(`Unsupported search provider: ${(params as ProviderParams).provider}`);
  }
}
