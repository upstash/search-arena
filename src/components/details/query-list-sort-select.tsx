import { BattleResult, BattleQuery } from "@/api/trpc";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { getDatabaseStats } from "@/lib/stats";
import { PROVIDERS, isValidProvider } from "@/lib/providers";

export type SortOptions =
  | "default"
  | "db1-score"
  | "db1-score-asc"
  | "db2-score"
  | "db2-score-asc"
  | "score-diff-1"
  | "score-diff-2"
  | "diff"
  | "variance";

export function QueryListSortSelect({
  sortBy,
  setSortBy,
  battle,
}: {
  sortBy: SortOptions;
  setSortBy: (value: SortOptions) => void;
  battle: BattleResult;
}) {
  const db1Color = isValidProvider(battle.database1.provider)
    ? PROVIDERS[battle.database1.provider].color
    : undefined;
  const db2Color = isValidProvider(battle.database2.provider)
    ? PROVIDERS[battle.database2.provider].color
    : undefined;

  return (
    <div className="p-3 border-b bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Queries</h3>
        <ArrowUpDown className="h-3 w-3 text-gray-400" />
      </div>
      <Select
        value={sortBy}
        onValueChange={(value: SortOptions) => setSortBy(value)}
      >
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default Order</SelectItem>
          <SelectItem value="db1-score">
            <code
              className="px-1"
              style={{ backgroundColor: db1Color?.["100"] }}
            >
              {battle.database1.label}
            </code>{" "}
            Score ↓
          </SelectItem>
          <SelectItem value="db1-score-asc">
            <code
              className="px-1"
              style={{ backgroundColor: db1Color?.["100"] }}
            >
              {battle.database1.label}
            </code>{" "}
            Score ↑
          </SelectItem>
          <SelectItem value="db2-score">
            <code
              className="px-1"
              style={{ backgroundColor: db2Color?.["100"] }}
            >
              {battle.database2.label}
            </code>{" "}
            Score ↓
          </SelectItem>
          <SelectItem value="db2-score-asc">
            <code
              className="px-1"
              style={{ backgroundColor: db2Color?.["100"] }}
            >
              {battle.database2.label}
            </code>{" "}
            Score ↑
          </SelectItem>
          <SelectItem value="score-diff-1">
            <code
              className="px-1"
              style={{ backgroundColor: db1Color?.["100"] }}
            >
              {battle.database1.label}
            </code>{" "}
            Overperforms ↓
          </SelectItem>
          <SelectItem value="score-diff-2">
            <code
              className="px-1"
              style={{ backgroundColor: db2Color?.["100"] }}
            >
              {battle.database2.label}
            </code>{" "}
            Overperforms ↓
          </SelectItem>
          <SelectItem value="diff">Diff ↓</SelectItem>
          <SelectItem value="variance">Variance (Std Dev) ↓</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function sortQueryResults({
  queries,
  sortBy,
  battle,
}: {
  queries: BattleQuery[];
  sortBy: SortOptions;
  battle: BattleResult;
}) {
  return [...queries].sort((a, b) => {
    const aStats1 = getDatabaseStats(a, battle.databaseId1, 1);
    const aStats2 = getDatabaseStats(a, battle.databaseId2, 2);
    const bStats1 = getDatabaseStats(b, battle.databaseId1, 1);
    const bStats2 = getDatabaseStats(b, battle.databaseId2, 2);

    switch (sortBy) {
      case "db1-score":
        return bStats1.mean - aStats1.mean; // Higher scores first
      case "db1-score-asc":
        return aStats1.mean - bStats1.mean; // Lower scores first
      case "db2-score":
        return bStats2.mean - aStats2.mean; // Higher scores first
      case "db2-score-asc":
        return aStats2.mean - bStats2.mean; // Lower scores first
      case "score-diff-1":
        const firstDiff = bStats1.mean - bStats2.mean;
        const secondDiff = aStats1.mean - aStats2.mean;
        return firstDiff - secondDiff; // Larger differences first
      case "score-diff-2":
        const firstDiff2 = bStats2.mean - bStats1.mean;
        const secondDiff2 = aStats2.mean - aStats1.mean;
        return firstDiff2 - secondDiff2; // Larger differences first
      case "diff":
        const firstDiff3 = Math.abs(bStats1.mean - bStats2.mean);
        const secondDiff3 = Math.abs(aStats1.mean - aStats2.mean);
        return firstDiff3 - secondDiff3; // Larger differences first
      case "variance":
        // Sort by highest max standard deviation
        const bMaxStdConf = Math.max(bStats1.stdDev, bStats2.stdDev);
        const aMaxStdConf = Math.max(aStats1.stdDev, aStats2.stdDev);
        return bMaxStdConf - aMaxStdConf;
      default:
        return 0;
    }
  });
}
