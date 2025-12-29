import { z } from "zod";

// =============================================================================
// Upstash Search Config
// =============================================================================

export const upstashSearchConfigSchema = z.strictObject({
  namespace: z.string().optional(),
  topK: z.number().int().min(1).max(500).default(10),
  reranking: z.boolean().default(true),
  inputEnrichment: z.boolean().default(true),
  semanticWeight: z.number().min(0).max(1).default(0.75),
});

export type UpstashSearchConfig = z.infer<typeof upstashSearchConfigSchema>;

// Default config for Upstash
export const DEFAULT_UPSTASH_CONFIG: UpstashSearchConfig = {
  topK: 10,
  reranking: true,
  inputEnrichment: true,
  semanticWeight: 0.75,
};

// =============================================================================
// Algolia Search Config
// =============================================================================

export const algoliaSearchConfigSchema = z.strictObject({
  index: z.string().optional(), // Override default index
  hitsPerPage: z.number().int().min(1).max(500).default(10),
});

export type AlgoliaSearchConfig = z.infer<typeof algoliaSearchConfigSchema>;

// Default config for Algolia
export const DEFAULT_ALGOLIA_CONFIG: AlgoliaSearchConfig = {
  hitsPerPage: 10,
};

// =============================================================================
// Union type for all search configs
// =============================================================================

export const searchConfigSchema = z.union([
  upstashSearchConfigSchema,
  algoliaSearchConfigSchema,
]);

export type SearchConfig = z.infer<typeof searchConfigSchema>;

// =============================================================================
// Validation helpers
// =============================================================================

export function parseUpstashSearchConfig(jsonString: string): UpstashSearchConfig {
  const parsed = JSON.parse(jsonString);
  return upstashSearchConfigSchema.parse(parsed);
}

export function parseAlgoliaSearchConfig(jsonString: string): AlgoliaSearchConfig {
  const parsed = JSON.parse(jsonString);
  return algoliaSearchConfigSchema.parse(parsed);
}

export function parseSearchConfig(
  provider: "upstash_search" | "algolia",
  jsonString: string
): UpstashSearchConfig | AlgoliaSearchConfig {
  switch (provider) {
    case "upstash_search":
      return parseUpstashSearchConfig(jsonString);
    case "algolia":
      return parseAlgoliaSearchConfig(jsonString);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function getDefaultConfig(
  provider: "upstash_search" | "algolia"
): UpstashSearchConfig | AlgoliaSearchConfig {
  switch (provider) {
    case "upstash_search":
      return DEFAULT_UPSTASH_CONFIG;
    case "algolia":
      return DEFAULT_ALGOLIA_CONFIG;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
