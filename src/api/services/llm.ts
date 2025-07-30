import { SearchResult } from "../providers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createStreamableUI, createStreamableValue } from "ai/rsc";
import { ReactNode } from "react";

interface EvaluationResult {
  score: number;
  feedback: string;
}

export class LLMService {
  private genAI: GoogleGenerativeAI;
  private modelName = "gemini-2.5-flash";

  constructor(apiKey?: string) {
    // Use environment variable if apiKey is not provided
    const key = apiKey || process.env.GOOGLE_API_KEY || "";
    if (!key) {
      console.warn(
        "No Google API key provided. LLM functionality will be limited."
      );
    }
    this.genAI = new GoogleGenerativeAI(key);
  }

  /**
   * Evaluates search results and assigns a score using Gemini 2.5 Flash
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
    if (!this.genAI) {
      throw new Error("Google API key is required for LLM evaluation");
    }

    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const formatOutput = (results: SearchResult[]) => {
      return results
        .map((result, index) => {
          return `Result ${index + 1}:\nTitle: ${result.title}\nDescription: ${result.description || "No description"}\nURL: ${result.url}\n`;
        })
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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
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

  /**
   * Stream evaluation results using Vercel's AI SDK
   * This method can be used for real-time feedback in the UI
   */
  async streamEvaluation(query: string, results: SearchResult[]) {
    const ui = createStreamableUI();
    const feedbackStream = createStreamableValue("");

    // Start async process to generate feedback
    (async () => {
      try {
        if (!this.genAI) {
          feedbackStream.append(
            "Error: Google API key is required for evaluation"
          );
          feedbackStream.done();
          return;
        }

        const model = this.genAI.getGenerativeModel({ model: this.modelName });

        // Format the search results for the prompt
        const formattedResults = results
          .map((result, index) => {
            return `Result ${index + 1}:\nTitle: ${result.title}\nDescription: ${result.description || "No description"}\nURL: ${result.url}\n`;
          })
          .join("\n");

        // Create the prompt for evaluation
        const prompt = `You are a search quality evaluator. Evaluate the relevance of the following search results for the query: "${query}"

${formattedResults}

Provide a detailed analysis of the search results quality.`;

        // Generate streaming content with the model
        const result = await model.generateContentStream(prompt);

        // Stream the response chunks
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          feedbackStream.append(chunkText);
        }

        feedbackStream.done();
      } catch (error) {
        console.error("Error streaming evaluation:", error);
        feedbackStream.append(
          `Error evaluating results: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        feedbackStream.done();
      }
    })();

    ui.append(feedbackStream as unknown as ReactNode);
    return ui;
  }
}
