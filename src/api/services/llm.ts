import { SearchResult } from "../providers";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

interface EvaluationResult {
  score: number;
  feedback: string;
}

const GEMINI_INPUT_PRICE_PER_MILLION = 0.30;
const GEMINI_OUTPUT_PRICE_PER_MILLION = 2.50;

export type UsageMetadata = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export class LLMService {
  private modelName = "google/gemini-2.5-flash";
  private hasApiKey: boolean;

  constructor() {
    const key = process.env.OPENROUTER_API_KEY || "";

    this.hasApiKey = !!key;
  }

  /**
   * Evaluates search results and assigns a score using Gemini 2.5 Flash
   * If no API key is available, returns fallback scores of 0
   */
  async evaluateSearchResults(
    query: string,
    results1: SearchResult[],
    results2: SearchResult[]
  ): Promise<{
    db1: EvaluationResult;
    db2: EvaluationResult;
    llmDuration: number;
    usage: UsageMetadata;
  }> {
    // Return fallback scores if no API key is available
    if (!this.hasApiKey) {
      console.log("No LLM API key available, returning fallback scores");
      return {
        db1: {
          score: -1,
          feedback: "",
        },
        db2: {
          score: -1,
          feedback: "",
        },
        llmDuration: 0,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          inputCost: 0,
          outputCost: 0,
          totalCost: 0,
        },
      };
    }
    const formatOutput = (results: SearchResult[]) => {
      const deduplicatedResults = deduplicateByDescription(results);

      // Get the first 10 results
      return deduplicatedResults
        .map((result, index) => {
          return `Result ${index + 1}:\nTitle: ${result.title}\nDescription: ${result.description || "No description"}\nURL: ${result.url}\n`;
        })
        .slice(0, 10)
        .join("\n");
    };

    // Format the search results for the prompt
    const formattedResults1 = formatOutput(results1);
    const formattedResults2 = formatOutput(results2);

    // Create the prompt for evaluation
    const prompt = `
You are a search quality evaluator. Evaluate the relevance of the following search results for the query: "${query}"
There is two different databases, database 1 and database 2. You have to compare the results of these two databases
and assign a score to each database based on the quality of the results and their relevance to the query.

Database 1 results:
${formattedResults1}

Database 2 results:
${formattedResults2}

## Evaluation Criteria
- Having irrelevant results down the list is not important. It is more important that the user can find what they are looking for without having to scroll through the results.

Provide your evaluation in the following JSON format only:
{
  "db1": {
    "score": [a number between 1.0 and 10.0, where 10 is perfect],
    "feedback": [a brief explanation of your score and assessment of the results]
  },
  "db2": {
    "score": [a number between 1.0 and 10.0, where 10 is perfect],
    "feedback": [a brief explanation of your score and assessment of the results]
  }
}`.trim();

    // Generate content with the model and measure timing
    const llmStart = performance.now();
    let result;
    let text;
    let usage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
    };

    try {
      const openrouter = createOpenRouter({
        apiKey: process.env.OPEN_ROUTER_API_KEY,
      });
      result = await generateText({
        model: openrouter(this.modelName),
        prompt: prompt,
      });

      text = result.text;

      const inputCost = result.usage.inputTokens ? (result.usage.inputTokens / 1_000_000) * GEMINI_INPUT_PRICE_PER_MILLION : 0;
      const outputCost = result.usage.outputTokens ? (result.usage.outputTokens / 1_000_000) * GEMINI_OUTPUT_PRICE_PER_MILLION : 0;

      usage = {
        ...result.usage,
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
        totalTokens: result.usage.totalTokens ?? 0,
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
      };

      console.log("Usage for LLM call:", usage);
    } catch (error) {
      console.error("LLM API call failed:", error);
      // Return fallback scores on API failure
      return {
        db1: {
          score: -1,
          feedback: "",
        },
        db2: {
          score: -1,
          feedback: "",
        },
        llmDuration: 0,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          inputCost: 0,
          outputCost: 0,
          totalCost: 0,
        },
      };
    }
    const llmEnd = performance.now();
    const llmDuration = llmEnd - llmStart;

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/); // Extract JSON object from text
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from LLM response");
    }

    try {
      const jsonResponse = JSON.parse(jsonMatch[0]);
      const db1Failed =
        !jsonResponse.db1 ||
        !jsonResponse.db1.score ||
        !jsonResponse.db1.feedback;
      const db2Failed =
        !jsonResponse.db2 ||
        !jsonResponse.db2.score ||
        !jsonResponse.db2.feedback;

      return {
        db1: {
          score: db1Failed ? -1 : parseFloat(jsonResponse.db1.score), // Default to 5.0 if parsing fails
          feedback: db1Failed
            ? "LLM response parsing failed: " + jsonMatch[0]
            : jsonResponse.db1.feedback,
        },
        db2: {
          score: db2Failed ? -1 : parseFloat(jsonResponse.db2.score), // Default to 5.0 if parsing fails
          feedback: db2Failed
            ? "LLM response parsing failed: " + jsonMatch[0]
            : jsonResponse.db2.feedback,
        },
        llmDuration,
        usage,
      };
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError);
      throw new Error("Failed to parse LLM evaluation response");
    }
  }
}

const deduplicateByDescription = (results: SearchResult[]) => {
  const contents = new Set<string>();
  return results.filter((result) => {
    if (contents.has(result.description)) {
      return false;
    }
    contents.add(result.description);
    return true;
  });
};
