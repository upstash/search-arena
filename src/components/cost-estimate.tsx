"use client";

import { useMemo } from "react";
import { DollarSign } from "lucide-react";

// Estimated cost per LLM evaluation based on Gemini 2.5 Flash pricing
// Calculated from actual usage: ~$0.010949 for 9 evaluations ≈ $0.00122 per evaluation
const ESTIMATED_COST_PER_EVALUATION = 0.00122;

interface CostEstimateProps {
  queries: string;
  ratingCount: number;
}

export function CostEstimate({ queries, ratingCount }: CostEstimateProps) {
  const costEstimate = useMemo(() => {
    const queryLines = queries
      ?.split("\n")
      .filter((line) => line.trim().length > 0);
    const queryCount = queryLines?.length || 0;
    const totalEvaluations = queryCount * ratingCount;
    const estimatedCost = totalEvaluations * ESTIMATED_COST_PER_EVALUATION;
    return {
      queryCount,
      ratingCount,
      totalEvaluations,
      estimatedCost,
    };
  }, [queries, ratingCount]);

  if (costEstimate.queryCount === 0) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
      <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-medium text-blue-900 dark:text-blue-100">
          Cost Estimate
        </p>
        <p className="text-blue-700 dark:text-blue-300 mt-1">
          Running{" "}
          <span className="font-semibold">
            {costEstimate.queryCount} quer
            {costEstimate.queryCount === 1 ? "y" : "ies"}
          </span>{" "}
          ×{" "}
          <span className="font-semibold">
            {costEstimate.ratingCount} rating
            {costEstimate.ratingCount === 1 ? "" : "s"}
          </span>{" "}
          ={" "}
          <span className="font-semibold">
            {costEstimate.totalEvaluations} evaluation
            {costEstimate.totalEvaluations === 1 ? "" : "s"}
          </span>
        </p>
        <p className="text-blue-700 dark:text-blue-300">
          Estimated cost:{" "}
          <span className="font-semibold">
            ${costEstimate.estimatedCost.toFixed(6)}
          </span>{" "}
          <span className="text-blue-600/70 dark:text-blue-400/70">
            (Gemini 2.5 Flash)
          </span>
        </p>
      </div>
    </div>
  );
}
