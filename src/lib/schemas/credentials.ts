// Re-export provider utilities from the centralized providers module
export {
  PROVIDERS,
  parseCredentials,
  validateCredentials,
} from "../providers";

// For backwards compatibility, export the schemas from PROVIDERS
import { PROVIDERS } from "../providers";

export const upstashCredentialsSchema = PROVIDERS.upstash_search.credentialsSchema;
export const algoliaCredentialsSchema = PROVIDERS.algolia.credentialsSchema;
