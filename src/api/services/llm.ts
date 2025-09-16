import { SearchResult } from "../providers";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

interface EvaluationResult {
  score: number;
  feedback: string;
}

export class LLMService {
  private modelName = "gemini-2.5-flash";
  private hasApiKey: boolean;

  constructor() {
    const key =
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      "";

    if (process.env.GOOGLE_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_API_KEY;
    }

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
      };
    }
    const formatOutput = (results: SearchResult[]) => {
      // Get the first 10 results
      return results
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

While evaluating, having irrelevant results is not important.
If the ordering of the results makes sense, and a user can find the things they want, that is important.

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
    try {
      result = await generateText({
        model: google(this.modelName),
        prompt: prompt,
      });
      text = result.text;
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
      };
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError);
      throw new Error("Failed to parse LLM evaluation response");
    }
  }
}
