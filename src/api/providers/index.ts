import { AlgoliaSearchProvider } from "./algolia";
import { UpstashSearchProvider } from "./upstash";
import { SearchProvider } from "./types";
import {
  isValidProvider,
  parseCredentials,
  parseSearchConfig,
} from "@/lib/providers";

export * from "./types";
export * from "./algolia";
export * from "./upstash";

// Provider class registry - maps provider key to its class constructor
const PROVIDER_CLASSES = {
  upstash_search: UpstashSearchProvider,
  algolia: AlgoliaSearchProvider,
} as const;

// Factory function to create the appropriate search provider
export function createSearchProvider(params: {
  provider: string;
  credentials: unknown;
  config: unknown;
}): SearchProvider {
  if (!isValidProvider(params.provider)) {
    throw new Error(`Unsupported search provider: ${params.provider}`);
  }

  const ProviderClass = PROVIDER_CLASSES[params.provider];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new ProviderClass(params.credentials as any, params.config as any);
}

// Factory function that accepts JSON strings for credentials and config
export function createSearchProviderFromStrings(params: {
  provider: string;
  credentialsJson: string;
  configJson: string;
}): SearchProvider {
  const credentials = parseCredentials(params.provider, params.credentialsJson);
  const config = parseSearchConfig(params.provider, params.configJson);

  return createSearchProvider({
    provider: params.provider,
    credentials,
    config,
  });
}
