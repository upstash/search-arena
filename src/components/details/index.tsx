"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/api/trpc/client";
import { SortOptions, sortQueryResults } from "./query-list-sort-select";
import { QueryDetails } from "./query-details";
import { QueryList } from "./query-list";

export function BattleDetails({ battleId }: { battleId: string }) {
  const utils = trpc.useUtils();
  const { data: battle } = trpc.battle.getById.useQuery({ id: battleId });

  const [selectedQueryIndex, setSelectedQueryIndex] = useState(0);
  const [sortBy, setSortBy] = useState<SortOptions>("default");

  // Refetching
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (battle?.status === "in_progress") {
      intervalId = setInterval(() => {
        utils.battle.getById.invalidate({ id: battleId });
        utils.battle.getQueryResults.invalidate({ battleId });
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    battle?.status,
    battleId,
    utils.battle.getById,
    utils.battle.getQueryResults,
  ]);

  if (!battle || battle?.queries.length === 0) return <div>Loading</div>;

  const sortedQueries = sortQueryResults({
    // @ts-expect-error BattleQuery type mismatch
    queries: battle.queries,
    sortBy,
    battle,
  });

  const selectedQuery = sortedQueries[selectedQueryIndex];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-150px)] min-h-[500px]">
        {/* Query List Sidebar */}
        <QueryList
          sortedQueries={sortedQueries}
          battle={battle}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedQueryIndex={selectedQueryIndex}
          setSelectedQueryIndex={setSelectedQueryIndex}
        />

        {/* Query Details Main Content */}
        <QueryDetails selectedQuery={selectedQuery} battle={battle} />
      </div>
    </div>
  );
}
