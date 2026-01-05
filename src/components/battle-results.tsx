"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Loader2, Plus } from "lucide-react";
import { trpc } from "@/api/trpc/client";
import { motion } from "motion/react";
import BattleResultsDataTable from "./battle-results-data-table";
import { BattleSetupModal } from "./battle-setup-modal";
import { useState } from "react";
import { Button } from "./ui/button";

export function BattleResults({ isDemo }: { isDemo: boolean }) {
  const [battleModalOpen, setBattleModalOpen] = useState(false);
  const { data: battleResults, isLoading } = trpc.battle.getAll.useQuery({
    isDemo,
  });

  const inProgressCount =
    battleResults?.filter(
      (b) => b.status === "in_progress" || b.status === "pending",
    ).length ?? 0;

  return (
    <div className="space-y-4">
      <BattleSetupModal
        open={battleModalOpen}
        onClose={() => setBattleModalOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-between items-start"
      >
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {isDemo ? "Example Results" : "Battle Results"}
          </h2>
          <p className="text-sm text-gray-600">
            {isDemo
              ? "Example query results made by our team"
              : "Database comparison history"}
          </p>
        </div>
        {!isDemo && inProgressCount > 0 && (
          <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>
              {inProgressCount} {inProgressCount === 1 ? "battle" : "battles"}{" "}
              in progress
            </span>
          </div>
        )}
      </motion.div>

      {battleResults?.length === 0 && !isLoading ? (
        <div>
          <Card>
            <CardContent className="text-center py-8">
              <div>
                <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No battles yet
              </h3>
              <p className="text-xs text-gray-600">
                Start your first database comparison battle
              </p>
              <Button
                onClick={() => setBattleModalOpen(true)}
                className="mt-4"
                variant={"outline"}
              >
                <Plus />
                New Battle
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>
          <BattleResultsDataTable isDemo={isDemo} />
        </div>
      )}
    </div>
  );
}
