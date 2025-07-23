import { AlgoliaCredentials, SearchProvider, SearchResult } from "./types";
import { algoliasearch } from "algoliasearch";
import { createFetchRequester } from "@algolia/requester-fetch";

export class AlgoliaSearchProvider implements SearchProvider {
  private credentials: AlgoliaCredentials;
  name = "algolia";

  constructor(credentials: AlgoliaCredentials) {
    this.credentials = credentials;
  }

  async search(query: string): Promise<SearchResult[]> {
    try {
      // Initialize the Algolia client with application ID and API key
      const client = algoliasearch(
        this.credentials.applicationId,
        this.credentials.apiKey,
        {
          requester: createFetchRequester(),
        }
      );

      // Define the type for search hits
      interface AlgoliaHit {
        id: number;
        objectID?: string;
        title?: string;
        overview?: string;
      }

      // Perform the search using client.search
      const { results } = await client.search({
        requests: [
          {
            indexName: this.credentials.index,
            query,
            hitsPerPage: 10,
          },
        ],
      });

      // Transform Algolia results to the common SearchResult format
      // Get hits from the first result
      // TypeScript needs a type assertion here
      const firstResult = results[0] as {
        hits?: Array<Record<string, unknown>>;
      };
      const hits = firstResult?.hits || [];

      // @ts-expect-error alksjdalksjd
      return hits.map((hit: AlgoliaHit) => {
        return {
          id: hit.objectID,
          title: hit.title,
          description: hit.overview,
        };
      });
    } catch (error) {
      console.error("Error searching Algolia:", error);
      throw new Error(
        `Algolia search failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

const a = {
  backdrop_path:
    "https://image.tmdb.org/t/p/w300/9lzBxaGXQ2Uy62caE1pzEnDko1h.jpg",
  id: 319,
  original_language: "en",
  original_title: "True Romance",
  overview:
    "Clarence marries hooker Alabama, steals cocaine from her pimp, and tries to sell it in Hollywood, while the owners of the coke try to reclaim it.",
  popularity: 4.8479,
  poster_path: "https://image.tmdb.org/t/p/w342/39lXk6ud6KiJgGbbWI2PUKS7y2.jpg",
  release_date: "1993-09-09",
  title: "True Romance",
  vote_average: 7.549,
  vote_count: 2835,
  cast: [
    { name: "Christian Slater", character: "Clarence Worley" },
    { name: "Patricia Arquette", character: "Alabama Whitman" },
    { name: "Dennis Hopper", character: "Clifford Worley" },
    { name: "Val Kilmer", character: "Mentor" },
    { name: "Gary Oldman", character: "Drexl Spivey" },
  ],
  crew: [{ name: "Tony Scott", job: "Director" }],
  genres: ["Action", "Crime", "Romance"],
  keywords: [
    "hotel",
    "parent child relationship",
    "movie business",
    "detective",
    "mexican standoff",
    "pimp",
    "cocaine",
    "ex-cop",
    "love",
    "murder",
    "on the run",
    "mafia",
    "comic book shop",
    "los angeles, california",
    "drugs",
    "detroit, michigan",
    "illegal prostitution",
    "sicilian",
    "gun violence",
    "aspiring actor",
    "neo-noir",
    "intimate",
    "suspenseful",
    "intense",
    "comforting",
    "euphoric",
  ],
  attribution:
    "This product uses the TMDB API but is not endorsed or certified by TMDB.",
  objectID: "media-sample-data-319",
  _highlightResult: {
    backdrop_path: {
      value: "https://image.tmdb.org/t/p/w300/9lzBxaGXQ2Uy62caE1pzEnDko1h.jpg",
      matchLevel: "none",
      matchedWords: [],
    },
    id: { value: "319", matchLevel: "none", matchedWords: [] },
    original_language: { value: "en", matchLevel: "none", matchedWords: [] },
    original_title: {
      value: "True Romance",
      matchLevel: "none",
      matchedWords: [],
    },
    overview: {
      value:
        "Clarence marries hooker Alabama, steals cocaine from her pimp, and tries to sell it in Hollywood, while the owners of the coke try to reclaim it.",
      matchLevel: "none",
      matchedWords: [],
    },
    popularity: { value: "4.8479", matchLevel: "none", matchedWords: [] },
    poster_path: {
      value: "https://image.tmdb.org/t/p/w342/39lXk6ud6KiJgGbbWI2PUKS7y2.jpg",
      matchLevel: "none",
      matchedWords: [],
    },
    release_date: { value: "1993-09-09", matchLevel: "none", matchedWords: [] },
    title: { value: "True Romance", matchLevel: "none", matchedWords: [] },
    vote_average: { value: "7.549", matchLevel: "none", matchedWords: [] },
    vote_count: { value: "2835", matchLevel: "none", matchedWords: [] },
    cast: [
      {
        name: {
          value: "Christian Slater",
          matchLevel: "none",
          matchedWords: [],
        },
        character: {
          value: "Clarence Worley",
          matchLevel: "none",
          matchedWords: [],
        },
      },
      {
        name: {
          value: "Patricia Arquette",
          matchLevel: "none",
          matchedWords: [],
        },
        character: {
          value: "Alabama Whitman",
          matchLevel: "none",
          matchedWords: [],
        },
      },
      {
        name: { value: "Dennis Hopper", matchLevel: "none", matchedWords: [] },
        character: {
          value: "Clifford Worley",
          matchLevel: "none",
          matchedWords: [],
        },
      },
      {
        name: { value: "Val Kilmer", matchLevel: "none", matchedWords: [] },
        character: { value: "Mentor", matchLevel: "none", matchedWords: [] },
      },
      {
        name: { value: "Gary Oldman", matchLevel: "none", matchedWords: [] },
        character: {
          value: "Drexl Spivey",
          matchLevel: "none",
          matchedWords: [],
        },
      },
    ],
    crew: [
      {
        name: { value: "Tony Scott", matchLevel: "none", matchedWords: [] },
        job: { value: "Director", matchLevel: "none", matchedWords: [] },
      },
    ],
    genres: [
      { value: "Action", matchLevel: "none", matchedWords: [] },
      { value: "Crime", matchLevel: "none", matchedWords: [] },
      { value: "Romance", matchLevel: "none", matchedWords: [] },
    ],
    keywords: [
      { value: "hotel", matchLevel: "none", matchedWords: [] },
      {
        value: "parent child relationship",
        matchLevel: "none",
        matchedWords: [],
      },
      {
        value: "<em>movie</em> business",
        matchLevel: "partial",
        fullyHighlighted: false,
        matchedWords: ["movie"],
      },
      { value: "detective", matchLevel: "none", matchedWords: [] },
      { value: "mexican standoff", matchLevel: "none", matchedWords: [] },
      { value: "pimp", matchLevel: "none", matchedWords: [] },
      { value: "cocaine", matchLevel: "none", matchedWords: [] },
      { value: "ex-cop", matchLevel: "none", matchedWords: [] },
      { value: "love", matchLevel: "none", matchedWords: [] },
      { value: "murder", matchLevel: "none", matchedWords: [] },
      { value: "on the run", matchLevel: "none", matchedWords: [] },
      {
        value: "<em>mafia</em>",
        matchLevel: "partial",
        fullyHighlighted: true,
        matchedWords: ["mafia"],
      },
      { value: "comic book shop", matchLevel: "none", matchedWords: [] },
      {
        value: "los angeles, california",
        matchLevel: "none",
        matchedWords: [],
      },
      { value: "drugs", matchLevel: "none", matchedWords: [] },
      { value: "detroit, michigan", matchLevel: "none", matchedWords: [] },
      { value: "illegal prostitution", matchLevel: "none", matchedWords: [] },
      { value: "sicilian", matchLevel: "none", matchedWords: [] },
      { value: "gun violence", matchLevel: "none", matchedWords: [] },
      { value: "aspiring actor", matchLevel: "none", matchedWords: [] },
      { value: "neo-noir", matchLevel: "none", matchedWords: [] },
      { value: "intimate", matchLevel: "none", matchedWords: [] },
      { value: "suspenseful", matchLevel: "none", matchedWords: [] },
      { value: "intense", matchLevel: "none", matchedWords: [] },
      { value: "comforting", matchLevel: "none", matchedWords: [] },
      { value: "euphoric", matchLevel: "none", matchedWords: [] },
    ],
    attribution: {
      value:
        "This product uses the TMDB API but is not endorsed or certified by TMDB.",
      matchLevel: "none",
      matchedWords: [],
    },
  },
};
