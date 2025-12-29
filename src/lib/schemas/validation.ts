import { z } from "zod";
import { fromError } from "zod-validation-error";
import {
  upstashCredentialsSchema,
  algoliaCredentialsSchema,
} from "./credentials";
import {
  upstashSearchConfigSchema,
  algoliaSearchConfigSchema,
} from "./search-config";

// =============================================================================
// Credential Validation
// =============================================================================

export function validateCredentials(
  provider: "upstash_search" | "algolia",
  json: string
): string | null {
  try {
    const parsed = JSON.parse(json);

    if (provider === "upstash_search") {
      upstashCredentialsSchema.parse(parsed);
    } else if (provider === "algolia") {
      algoliaCredentialsSchema.parse(parsed);
    }

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
// Search Config Validation
// =============================================================================

export function validateSearchConfig(
  provider: "upstash_search" | "algolia",
  json: string
): string | null {
  console.log("Validation", {
    provider,
    json,
  });
  try {
    const parsed = JSON.parse(json);

    if (provider === "upstash_search") {
      upstashSearchConfigSchema.parse(parsed);
    } else if (provider === "algolia") {
      algoliaSearchConfigSchema.parse(parsed);
    }

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
