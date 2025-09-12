import colors from "tailwindcss/colors";

export type Provider = keyof typeof PROVIDERS;

export const PROVIDERS = {
  upstash_search: {
    name: "Upstash",
    color: colors.emerald,
    env: `
UPSTASH_URL=https://your-database.upstash.io
UPSTASH_TOKEN=your-rest-token
UPSTASH_INDEX=your-index-name
UPSTASH_RERANKING=true
UPSTASH_INPUT_ENRICHMENT=true
`,
  },
  algolia: {
    name: "Algolia",
    color: colors.blue,
    env: `
ALGOLIA_APPLICATION_ID=your-app-id
ALGOLIA_API_KEY=your-api-key
ALGOLIA_INDEX=your-index-name
`,
  },
};
