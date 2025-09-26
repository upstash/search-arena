import { BattleResult, BattleQuery } from "@/api/trpc";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export type SortOptions =
  | "default"
  | "db1-score"
  | "db1-score-asc"
  | "db2-score"
  | "db2-score-asc"
  | "score-diff-1"
  | "score-diff-2"
  | "diff";

export function QueryListSortSelect({
  sortBy,
  setSortBy,
  battle,
}: {
  sortBy: SortOptions;
  setSortBy: (value: SortOptions) => void;
  battle: BattleResult;
}) {
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
            <code className="bg-blue-100 px-1">{battle.database1.label}</code>{" "}
            Score ↓
          </SelectItem>
          <SelectItem value="db1-score-asc">
            <code className="bg-blue-100 px-1">{battle.database1.label}</code>{" "}
            Score ↑
          </SelectItem>
          <SelectItem value="db2-score">
            <code className="bg-green-100 px-1">{battle.database2.label}</code>{" "}
            Score ↓
          </SelectItem>
          <SelectItem value="db2-score-asc">
            <code className="bg-green-100 px-1">{battle.database2.label}</code>{" "}
            Score ↑
          </SelectItem>
          <SelectItem value="score-diff-1">
            <code className="bg-blue-100 px-1">{battle.database1.label}</code>{" "}
            Overperforms ↓
          </SelectItem>
          <SelectItem value="score-diff-2">
            <code className="bg-green-100 px-1">{battle.database2.label}</code>{" "}
            Overperforms ↓
          </SelectItem>
          <SelectItem value="diff">Diff ↓</SelectItem>
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
    const aDb1Result = a.results.find(
      (r) => r.databaseId === battle?.databaseId1
    );
    const aDb2Result = a.results.find(
      (r) => r.databaseId === battle?.databaseId2
    );

    const bDb1Result = b.results.find(
      (r) => r.databaseId === battle?.databaseId1
    );
    const bDb2Result = b.results.find(
      (r) => r.databaseId === battle?.databaseId2
    );

    if (!aDb1Result || !aDb2Result || !bDb1Result || !bDb2Result) {
      return 0;
    }

    switch (sortBy) {
      case "db1-score":
        return Number(bDb1Result.score) - Number(aDb1Result.score); // Higher scores first
      case "db1-score-asc":
        return Number(aDb1Result.score) - Number(bDb1Result.score); // Lower scores first
      case "db2-score":
        return Number(bDb2Result.score) - Number(aDb2Result.score); // Higher scores first
      case "db2-score-asc":
        return Number(aDb2Result.score) - Number(bDb2Result.score); // Lower scores first
      case "score-diff-1":
        const firstDiff = Number(bDb1Result.score) - Number(bDb2Result.score);
        const secondDiff = Number(aDb1Result.score) - Number(aDb2Result.score);
        return firstDiff - secondDiff; // Larger differences first
      case "score-diff-2":
        const firstDiff2 = Number(bDb2Result.score) - Number(bDb1Result.score);
        const secondDiff2 = Number(aDb2Result.score) - Number(aDb1Result.score);
        return firstDiff2 - secondDiff2; // Larger differences first
      case "diff":
        const firstDiff3 = Math.abs(
          Number(bDb1Result.score) - Number(bDb2Result.score)
        );
        const secondDiff3 = Math.abs(
          Number(aDb1Result.score) - Number(aDb2Result.score)
        );
        return firstDiff3 - secondDiff3; // Larger differences first
      default:
        return 0;
    }
  });
}
