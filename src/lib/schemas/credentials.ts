import { z } from "zod";

// =============================================================================
// Upstash Credentials
// =============================================================================

export const upstashCredentialsSchema = z.object({
  url: z.string().url(),
  token: z.string().min(1),
  defaultNamespace: z.string().optional(),
});

export type UpstashCredentials = z.infer<typeof upstashCredentialsSchema>;

// =============================================================================
// Algolia Credentials
// =============================================================================

export const algoliaCredentialsSchema = z.object({
  applicationId: z.string().min(1),
  apiKey: z.string().min(1),
  defaultIndex: z.string().min(1),
});

export type AlgoliaCredentials = z.infer<typeof algoliaCredentialsSchema>;

// =============================================================================
// Union type for all credentials
// =============================================================================

export const credentialsSchema = z.union([
  upstashCredentialsSchema,
  algoliaCredentialsSchema,
]);

export type Credentials = z.infer<typeof credentialsSchema>;

// =============================================================================
// Validation helpers
// =============================================================================

export function parseUpstashCredentials(jsonString: string): UpstashCredentials {
  const parsed = JSON.parse(jsonString);
  return upstashCredentialsSchema.parse(parsed);
}

export function parseAlgoliaCredentials(jsonString: string): AlgoliaCredentials {
  const parsed = JSON.parse(jsonString);
  return algoliaCredentialsSchema.parse(parsed);
}

export function parseCredentials(
  provider: "upstash_search" | "algolia",
  jsonString: string
): UpstashCredentials | AlgoliaCredentials {
  switch (provider) {
    case "upstash_search":
      return parseUpstashCredentials(jsonString);
    case "algolia":
      return parseAlgoliaCredentials(jsonString);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
