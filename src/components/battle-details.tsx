"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trophy, ArrowUpDown } from "lucide-react";
import { trpc } from "@/api/trpc/client";
import { motion, AnimatePresence } from "motion/react";
import { ProviderBadge } from "./provider-badge";

interface BattleDetailsProps {
  battleId: string;
}

type SortOption =
  | "default"
  | "db1-score"
  | "db2-score"
  | "score-diff-1"
  | "score-diff-2"
  | "diff";

export function BattleDetails({ battleId }: BattleDetailsProps) {
  const utils = trpc.useUtils();
  const { data: battle } = trpc.battle.getById.useQuery({ id: battleId });
  trpc.battle.getQueryResults.useQuery({ battleId }, { enabled: !!battleId });

  // Set up automatic refetching for in-progress battles
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (battle?.status === "in_progress") {
      // Refetch every 3 seconds if the battle is in progress
      intervalId = setInterval(() => {
        utils.battle.getById.invalidate({ id: battleId });
        utils.battle.getQueryResults.invalidate({ battleId });
      }, 3000);
    }

    // Clean up interval on unmount or when status changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    battle?.status,
    battleId,
    utils.battle.getById,
    utils.battle.getQueryResults,
  ]);

  const [selectedQueryIndex, setSelectedQueryIndex] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [hideDescriptions, setHideDescriptions] = useState(false);

  const sortedResults = [...(battle?.queries || [])].sort((a, b) => {
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
      case "db2-score":
        return Number(bDb2Result.score) - Number(aDb2Result.score); // Higher scores first
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

  const selectedQuery = sortedResults[selectedQueryIndex];

  if (!battle) return <div>Loading</div>;

  return (
    <div className="space-y-4">
      {/* The old header, it takes too much space */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader className="">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Trophy className="h-4 w-4" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {battle?.label}
              </motion.span>
            </CardTitle>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CardDescription className="text-sm">
                {battle?.createdAt?.toLocaleString()} •{" "}
                {battle?.queries?.length || 0} queries
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid grid-cols-2 gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.2 }}
            >
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <span className="text-sm font-medium">
                    {battle?.database1.label}
                  </span>
                  <ProviderBadge provider={battle?.database1.provider} />
                  {battle.meanScoreDb1 &&
                    battle.meanScoreDb2 &&
                    battle.meanScoreDb1 > battle.meanScoreDb2 && (
                      <Trophy className="h-3 w-3 text-yellow-500" />
                    )}
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {battle.meanScoreDb1}
                </div>
              </div>

              <div className="text-center p-3 bg-green-50 rounded">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <span className="text-sm font-medium">
                    {battle.database2.label}
                  </span>
                  <ProviderBadge provider={battle?.database2.provider} />
                  {battle.meanScoreDb2 &&
                    battle.meanScoreDb1 &&
                    battle.meanScoreDb2 > battle.meanScoreDb1 && (
                      <Trophy className="h-3 w-3 text-yellow-500" />
                    )}
                  {battle.meanScoreDb1 === battle.meanScoreDb2 && (
                    <Trophy className="h-3 w-3 text-gray-400" />
                  )}
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {battle.meanScoreDb2}
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div> */}

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-150px)] min-h-[500px]">
        {/* Query List Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="w-full md:w-64 flex-shrink-0 overflow-y-auto border rounded bg-white"
        >
          {/* Header */}
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Queries</h3>
              <ArrowUpDown className="h-3 w-3 text-gray-400" />
            </div>
            <Select
              value={sortBy}
              onValueChange={(value: SortOption) => setSortBy(value)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Order</SelectItem>
                <SelectItem value="db1-score">
                  <code className="bg-blue-100 px-1">
                    {battle.database1.label}
                  </code>{" "}
                  Score ↓
                </SelectItem>
                <SelectItem value="db2-score">
                  <code className="bg-green-100 px-1">
                    {battle.database2.label}
                  </code>{" "}
                  Score ↓
                </SelectItem>
                <SelectItem value="score-diff-1">
                  <code className="bg-blue-100 px-1">
                    {battle.database1.label}
                  </code>{" "}
                  Highlight ↓
                </SelectItem>
                <SelectItem value="score-diff-2">
                  <code className="bg-green-100 px-1">
                    {battle.database2.label}
                  </code>{" "}
                  Highlight ↓
                </SelectItem>
                <SelectItem value="diff">Diff ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Query List */}
          <div className="divide-y">
            {sortedResults.map((queryResult, index) => (
              <div
                key={index}
                className={`p-2 cursor-pointer hover:bg-gray-50 ${
                  selectedQueryIndex === index
                    ? "bg-gray-100 border-l-2 border-blue-600"
                    : ""
                }`}
                onClick={() => setSelectedQueryIndex(index)}
              >
                <div className="text-xs font-medium truncate mb-1">
                  {queryResult.queryText}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex space-x-2">
                    <span className="text-blue-600 font-mono">
                      {
                        queryResult.results.find(
                          (r) => r.databaseId === battle?.databaseId1
                        )?.score
                      }
                    </span>
                    <span className="text-gray-400">vs</span>
                    <span className="text-green-600 font-mono">
                      {
                        queryResult.results.find(
                          (r) => r.databaseId === battle?.databaseId2
                        )?.score
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500 font-mono">
                      Δ
                      {Math.abs(
                        Number(
                          queryResult.results.find(
                            (r) => r.databaseId === battle?.databaseId1
                          )?.score
                        ) -
                          Number(
                            queryResult.results.find(
                              (r) => r.databaseId === battle?.databaseId2
                            )?.score
                          )
                      ).toFixed(1)}
                    </span>
                    {Number(
                      queryResult.results.find(
                        (r) => r.databaseId === battle?.databaseId1
                      )?.score
                    ) >
                    Number(
                      queryResult.results.find(
                        (r) => r.databaseId === battle?.databaseId2
                      )?.score
                    ) ? (
                      <Trophy className="h-3 w-3 text-blue-500" />
                    ) : Number(
                        queryResult.results.find(
                          (r) => r.databaseId === battle?.databaseId2
                        )?.score
                      ) >
                      Number(
                        queryResult.results.find(
                          (r) => r.databaseId === battle?.databaseId1
                        )?.score
                      ) ? (
                      <Trophy className="h-3 w-3 text-green-500" />
                    ) : (
                      <Trophy className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Query Results Main Content */}
        <motion.div
          className="flex-grow overflow-y-auto border rounded bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <motion.h2
                className="text-sm font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Results: &quot;{selectedQuery.queryText}&quot;
              </motion.h2>
              <motion.div
                className="flex items-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Checkbox
                  id="hide-descriptions"
                  checked={hideDescriptions}
                  onClick={() => setHideDescriptions(!hideDescriptions)}
                  className="h-5 w-5 cursor-pointer"
                />
                <label
                  htmlFor="hide-descriptions"
                  className="text-xs text-gray-600 cursor-pointer"
                >
                  Hide descriptions
                </label>
              </motion.div>
            </div>
          </div>

          <div className="p-3">
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              {sortedResults[selectedQueryIndex].results
                .sort((a) => (a.databaseId === battle.databaseId1 ? -1 : 1))
                .map((result) => (
                  <div key={result.id}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">
                        {result.databaseId === battle.databaseId1
                          ? battle.database1.label
                          : battle.database2.label}
                      </h3>
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        Score: {result.score}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 my-2 h-[100px] overflow-scroll">
                      {result.llmFeedback}
                    </p>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {(result.results as SearchResult[]).map(
                          (item, index) => (
                            <motion.div
                              key={index}
                              className="border rounded p-2 text-xs"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{
                                duration: 0.3,
                                delay: index * 0.05,
                              }}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium text-sm">
                                  {item.title}
                                </h4>
                                <span className="text-gray-500 font-mono">
                                  {item.score}
                                </span>
                              </div>
                              <motion.p
                                className="text-gray-600 text-xs leading-relaxed overflow-hidden"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{
                                  opacity: 1,
                                  height: hideDescriptions ? 0 : "auto",
                                }}
                              >
                                {item.description}
                              </motion.p>
                            </motion.div>
                          )
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export type SearchResult = {
  id: string;
  title: string;
  description: string;
  score: number;
};

export const BattleHeader = ({ battleId }: { battleId: string }) => {
  const { data: battle } = trpc.battle.getById.useQuery({ id: battleId });

  if (!battle) return;

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">{battle.database1.label}</span>
        <ProviderBadge provider={battle.database1.provider} />
        {battle.meanScoreDb1 &&
          battle.meanScoreDb2 &&
          battle.meanScoreDb1 > battle.meanScoreDb2 && (
            <Trophy className="h-3 w-3 text-yellow-500" />
          )}
      </div>
      <div className="text-2xl font-bold text-blue-600">
        {battle.meanScoreDb1}
      </div>
      <div className="text-2xl font-bold text-gray-600">vs</div>
      <div className="text-2xl font-bold text-green-600">
        {battle.meanScoreDb2}
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">{battle.database2.label}</span>
        <ProviderBadge provider={battle.database2.provider} />
        {battle.meanScoreDb2 &&
          battle.meanScoreDb1 &&
          battle.meanScoreDb2 > battle.meanScoreDb1 && (
            <Trophy className="h-3 w-3 text-yellow-500" />
          )}
        {battle.meanScoreDb1 === battle.meanScoreDb2 && (
          <Trophy className="h-3 w-3 text-gray-400" />
        )}
      </div>
    </motion.div>
  );
};
