"use client";

import { useEffect } from "react";
import { trpc } from "@/api/trpc/client";
import { SortOptions, sortQueryResults } from "./query-list-sort-select";
import { QueryDetails } from "./query-details";
import { QueryList } from "./query-list";
import { BattleDetailsSkeleton } from "./skeleton";
import { BattleHeader } from "./header";
import { motion } from "motion/react";
import { useQueryState } from "@/hooks/use-query-state";

export function BattleDetails({ battleId }: { battleId: string }) {
  const utils = trpc.useUtils();
  const { data: battle } = trpc.battle.getById.useQuery({ id: battleId });

  const [selectedQueryIndex, setSelectedQueryIndex] = useQueryState(
    "query",
    "0",
  );
  const [sortByState, setSortBy] = useQueryState<SortOptions>("sort");
  const sortBy = sortByState ?? "default";

  console.log("sortBy", sortBy);

  useEffect(() => {
    if (Number.isNaN(Number(selectedQueryIndex))) {
      setSelectedQueryIndex("0");
    }
  }, [selectedQueryIndex, setSelectedQueryIndex]);

  const index = Number.isNaN(Number(selectedQueryIndex))
    ? 0
    : Number(selectedQueryIndex);

  // Refetching
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (battle?.status === "in_progress") {
      intervalId = setInterval(() => {
        utils.battle.getById.invalidate({ id: battleId });
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [battle?.status, battleId, utils.battle.getById]);

  if (!battle || battle?.queries.length === 0) return <BattleDetailsSkeleton />;

  const sortedQueries = sortQueryResults({
    // @ts-expect-error BattleQuery type mismatch
    queries: battle.queries,
    sortBy,
    battle,
  });

  const selectedQuery = sortedQueries[index];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ viewTransitionName: "battle-details" }}
    >
      {/* Battle Header with Label and Scores */}
      <div className="space-y-2">
        <motion.h1
          className="text-2xl font-bold text-gray-900"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {battle.label}
        </motion.h1>
        <BattleHeader battleId={battleId} />
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Query List Sidebar */}
        <motion.div
          className="view-transition-query-list"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <QueryList
            sortedQueries={sortedQueries}
            battle={battle}
            sortBy={sortBy}
            setSortBy={setSortBy}
            selectedQueryIndex={index}
            setSelectedQueryIndex={(index) =>
              setSelectedQueryIndex(index.toString())
            }
          />
        </motion.div>

        {/* Query Details Main Content */}
        <motion.div
          className="view-transition-query-details w-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <QueryDetails selectedQuery={selectedQuery} battle={battle} />
        </motion.div>
      </div>
    </motion.div>
  );
}
