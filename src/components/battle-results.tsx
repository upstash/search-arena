"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Loader2 } from "lucide-react";
import { trpc } from "@/api/trpc/client";
import { useEffect, useState } from "react";
import { BattleSetupModal } from "./battle-setup-modal";
import { motion } from "motion/react";
import { BattleResultsDataTable } from "./battle-results-data-table";

export function BattleResults() {
  const utils = trpc.useUtils();
  const { data: battleResults } = trpc.battle.getAll.useQuery();
  const [editBattleData, setEditBattleData] = useState<{
    open: boolean;
    data: {
      label: string;
      databaseId1: string;
      databaseId2: string;
      queries: string;
    } | null;
  }>({
    open: false,
    data: null,
  });

  const hasInProgressBattles = battleResults?.some(
    (battle) => battle.status === "in_progress"
  );

  // Set up automatic refetching for in-progress battles
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (hasInProgressBattles) {
      intervalId = setInterval(() => {
        utils.battle.getAll.invalidate();
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [hasInProgressBattles, utils.battle.getAll]);

  if (!battleResults) return "Loading...";

  // Determine if we should show a global refetch notification
  const inProgressCount = battleResults.filter(
    (b) => b.status === "in_progress"
  ).length;

  return (
    <div className="space-y-4">
      {/* Edit Battle Modal */}
      {editBattleData.open && (
        <BattleSetupModal
          open={editBattleData.open}
          onClose={() => setEditBattleData({ open: false, data: null })}
          initialData={editBattleData.data || undefined}
        />
      )}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Battle Results</h2>
          <p className="text-sm text-gray-600">Database comparison history</p>
        </div>
        {inProgressCount > 0 && (
          <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>
              {inProgressCount} {inProgressCount === 1 ? "battle" : "battles"}{" "}
              in progress
            </span>
          </div>
        )}
      </div>

      {battleResults.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            </motion.div>
            <motion.h3
              className="text-sm font-medium text-gray-900 mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No battles yet
            </motion.h3>
            <motion.p
              className="text-xs text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Start your first database comparison battle
            </motion.p>
          </CardContent>
        </Card>
      ) : (
        <BattleResultsDataTable />
      )}
    </div>
  );
}
