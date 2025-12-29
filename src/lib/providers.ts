import colors from "tailwindcss/colors";
import { z } from "zod";
import { fromError } from "zod-validation-error";

// =============================================================================
// Provider Registry - Single source of truth for all provider information
// =============================================================================

export const PROVIDERS = {
  upstash_search: {
    name: "Upstash",
    color: colors.emerald,
    credentialsSchema: z.object({
      url: z.string().url(),
      token: z.string().min(1),
      defaultNamespace: z.string().optional(),
    }),
    searchConfigSchema: z.strictObject({
      namespace: z.string().optional(),
      topK: z.number().int().min(1).max(500).default(10),
      reranking: z.boolean().default(true),
      inputEnrichment: z.boolean().default(true),
      semanticWeight: z.number().min(0).max(1).default(0.75),
    }),
    defaultConfig: {
      topK: 10,
      reranking: true,
      inputEnrichment: true,
      semanticWeight: 0.75,
    },
  },

  algolia: {
    name: "Algolia",
    color: colors.blue,
    credentialsSchema: z.object({
      applicationId: z.string().min(1),
      apiKey: z.string().min(1),
      defaultIndex: z.string().min(1),
    }),
    searchConfigSchema: z.strictObject({
      index: z.string().optional(),
      hitsPerPage: z.number().int().min(1).max(500).default(10),
    }),
    defaultConfig: {
      hitsPerPage: 10,
    },
  },
} as const;

// =============================================================================
// Type Exports
// =============================================================================

/** All valid provider keys */
export type Provider = keyof typeof PROVIDERS;

/** Array of all provider keys */
export const PROVIDER_KEYS = Object.keys(PROVIDERS) as Provider[];

/** Default provider to use when none is specified */
export const DEFAULT_PROVIDER: Provider = "upstash_search";

/** Type guard to check if a string is a valid provider */
export function isValidProvider(provider: string): provider is Provider {
  return provider in PROVIDERS;
}

/** Get provider definition, throws if invalid */
export function getProvider(provider: string) {
  if (!isValidProvider(provider)) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  return PROVIDERS[provider];
}

// =============================================================================
// Credential Helpers
// =============================================================================

/** Parse and validate credentials JSON string for a provider */
export function parseCredentials(provider: string, jsonString: string) {
  const providerDef = getProvider(provider);
  const parsed = JSON.parse(jsonString);
  return providerDef.credentialsSchema.parse(parsed);
}

/** Validate credentials JSON string, returns error message or null */
export function validateCredentials(
  provider: string,
  jsonString: string
): string | null {
  try {
    parseCredentials(provider, jsonString);
    return null;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return "Invalid JSON format";
    }
    if (error instanceof z.ZodError) {
      return fromError(error).toString();
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "Validation error";
  }
}

// =============================================================================
// Search Config Helpers
// =============================================================================

/** Parse and validate search config JSON string for a provider */
export function parseSearchConfig(provider: string, jsonString: string) {
  const providerDef = getProvider(provider);
  const parsed = JSON.parse(jsonString);
  return providerDef.searchConfigSchema.parse(parsed);
}

/** Get default search config for a provider */
export function getDefaultConfig(provider: string) {
  return getProvider(provider).defaultConfig;
}

/** Validate search config JSON string, returns error message or null */
export function validateSearchConfig(
  provider: string,
  jsonString: string
): string | null {
  try {
    parseSearchConfig(provider, jsonString);
    return null;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return "Invalid JSON format";
    }
    if (error instanceof z.ZodError) {
      return fromError(error).toString();
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "Validation error";
  }
}
