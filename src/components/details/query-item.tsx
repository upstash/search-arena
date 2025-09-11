import { BattleQuery, BattleResult } from "@/api/trpc";
import { Trophy } from "lucide-react";

export function QueryItem({
  queryResult,
  battle,
  index,
  isSelected,
  onSelect,
}: {
  queryResult: BattleQuery;
  battle: BattleResult;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}) {
  // Find database results
  const db1Result = queryResult.results.find(
    (r) => r.databaseId === battle?.databaseId1
  );
  const db2Result = queryResult.results.find(
    (r) => r.databaseId === battle?.databaseId2
  );

  // Calculate score difference
  const scoreDiff = Math.abs(
    Number(db1Result?.score) - Number(db2Result?.score)
  );

  // Determine winner
  const db1Wins = Number(db1Result?.score) > Number(db2Result?.score);
  const db2Wins = Number(db2Result?.score) > Number(db1Result?.score);
  const isLLMDisabled = db1Result?.score === "-1" && db2Result?.score === "-1";

  return (
    <div
      key={index}
      className={`p-2 cursor-pointer hover:bg-gray-50 ${
        isSelected ? "bg-gray-100 border-l-2 border-blue-600" : ""
      }`}
      onClick={() => onSelect(index)}
    >
      <div className="text-xs font-medium truncate mb-1">
        {queryResult.queryText}
      </div>
      {queryResult.error ? (
        <div className="text-red-500 text-xs truncate whitespace-normal max-h-[50px]">
          {queryResult.error}
        </div>
      ) : !isLLMDisabled ? (
        <div className="flex items-center justify-between text-xs">
          <div className="flex space-x-2">
            <span className="text-blue-600 font-mono">{db1Result?.score}</span>
            <span className="text-gray-400">vs</span>
            <span className="text-green-600 font-mono">{db2Result?.score}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-500 font-mono">
              Δ{scoreDiff.toFixed(1)}
            </span>
            {db1Wins ? (
              <Trophy className="h-3 w-3 text-blue-500" />
            ) : db2Wins ? (
              <Trophy className="h-3 w-3 text-green-500" />
            ) : (
              <Trophy className="h-3 w-3 text-gray-400" />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
