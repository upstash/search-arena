import { BattleQuery, BattleResult } from "@/api/trpc";
import { Trophy } from "lucide-react";
import { getDatabaseStats } from "@/lib/stats";
import { PROVIDERS, isValidProvider } from "@/lib/providers";

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
  const db1Stats = getDatabaseStats(queryResult, battle.databaseId1, 1);
  const db2Stats = getDatabaseStats(queryResult, battle.databaseId2, 2);

  // Calculate score difference
  const scoreDiff = Math.abs(db1Stats.mean - db2Stats.mean);

  // Determine winner
  const db1Wins = db1Stats.mean > db2Stats.mean;
  const db2Wins = db2Stats.mean > db1Stats.mean;
  const isLLMDisabled = db1Stats.mean === -1 && db2Stats.mean === -1;

  const db1Color = isValidProvider(battle.database1.provider)
    ? PROVIDERS[battle.database1.provider].color
    : undefined;
  const db2Color = isValidProvider(battle.database2.provider)
    ? PROVIDERS[battle.database2.provider].color
    : undefined;

  return (
    <div
      key={index}
      className={`p-2 cursor-pointer hover:bg-gray-50 ${
        isSelected ? "bg-gray-100 border-l-2" : ""
      }`}
      style={{
        borderLeftColor: isSelected ? db1Color?.["600"] : undefined,
      }}
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
            <span className="font-mono" style={{ color: db1Color?.["600"] }}>
              {db1Stats.mean.toFixed(1)}
            </span>
            <span className="text-gray-400">vs</span>
            <span className="font-mono" style={{ color: db2Color?.["600"] }}>
              {db2Stats.mean.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-500 font-mono">
              Δ{scoreDiff.toFixed(1)}
            </span>
            {db1Wins ? (
              <Trophy
                className="h-3 w-3"
                style={{ color: db1Color?.["500"] }}
              />
            ) : db2Wins ? (
              <Trophy
                className="h-3 w-3"
                style={{ color: db2Color?.["500"] }}
              />
            ) : (
              <Trophy className="h-3 w-3 text-gray-400" />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
