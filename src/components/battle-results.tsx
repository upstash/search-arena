"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Loader2 } from "lucide-react";
import { trpc } from "@/api/trpc/client";
import { useState, useCallback } from "react";
import { BattleSetupModal } from "./battle-setup-modal";
import { motion } from "motion/react";
import BattleResultsDataTable from "./battle-results-data-table";

export function BattleResults() {
  const { data: battleResults } = trpc.battle.getAll.useQuery();
  const utils = trpc.useUtils();
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

  const deleteBattleMutation = trpc.battle.delete.useMutation({
    onSuccess: () => {
      utils.battle.getAll.invalidate();
    },
    onError: (error) => {
      console.error("Failed to delete battle:", error.message);
    },
  });

  const handleEditBattle = useCallback(
    (id: string) => {
      const battle = battleResults?.find((b) => b.id === id);
      if (battle) {
        setEditBattleData({
          open: true,
          data: {
            label: battle.label,
            databaseId1: battle.databaseId1,
            databaseId2: battle.databaseId2,
            queries: battle.queries,
          },
        });
      }
    },
    [battleResults]
  );

  const handleDeleteBattle = useCallback(
    (id: string) => {
      deleteBattleMutation.mutate({ battleId: id });
    },
    [deleteBattleMutation]
  );

  // Determine if we should show a global refetch notification
  const inProgressCount =
    battleResults?.filter(
      (b) => b.status === "in_progress" || b.status === "pending"
    ).length ?? 0;

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-between items-start"
      >
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
      </motion.div>

      {battleResults?.length === 0 ? (
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <BattleResultsDataTable
            handleEditBattle={handleEditBattle}
            handleDeleteBattle={handleDeleteBattle}
          />
        </motion.div>
      )}
    </div>
  );
}
