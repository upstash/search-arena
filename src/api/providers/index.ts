import { AlgoliaSearchProvider } from "./algolia";
import { UpstashSearchProvider } from "./upstash";
import { SearchProvider } from "./types";

export * from "./types";
export * from "./algolia";
export * from "./upstash";

// Utility function to parse env file
function parseEnvFile(envFile: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = envFile
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"));

  for (const line of lines) {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      result[key.trim()] = valueParts.join("=").trim();
    }
  }

  return result;
}

// Factory function to create the appropriate search provider based on env file
export function createSearchProvider(
  provider: "algolia" | "upstash_search",
  envFile: string
): SearchProvider {
  const env = parseEnvFile(envFile);

  switch (provider) {
    case "algolia":
      const algoliaAppId = env.ALGOLIA_APPLICATION_ID;
      const algoliaApiKey = env.ALGOLIA_API_KEY;
      const algoliaIndex = env.ALGOLIA_INDEX;

      if (!algoliaAppId || !algoliaApiKey || !algoliaIndex) {
        throw new Error(
          "Missing Algolia credentials: ALGOLIA_APPLICATION_ID, ALGOLIA_API_KEY, and ALGOLIA_INDEX are required"
        );
      }

      return new AlgoliaSearchProvider({
        applicationId: algoliaAppId,
        apiKey: algoliaApiKey,
        index: algoliaIndex,
      });

    case "upstash_search":
      const upstashUrl = env.UPSTASH_URL;
      const upstashToken = env.UPSTASH_TOKEN;
      const upstashIndex = env.UPSTASH_INDEX;

      if (!upstashUrl || !upstashToken || !upstashIndex) {
        throw new Error(
          "Missing Upstash Search credentials: UPSTASH_URL, UPSTASH_TOKEN, and UPSTASH_INDEX are required"
        );
      }

      return new UpstashSearchProvider({
        url: upstashUrl,
        token: upstashToken,
        index: upstashIndex,
      });

    default:
      throw new Error(`Unsupported search provider: ${provider}`);
  }
}
