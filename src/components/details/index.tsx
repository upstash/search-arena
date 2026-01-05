"use client";

import { useEffect, useState, useRef } from "react";
import { trpc } from "@/api/trpc/client";
import { SortOptions, sortQueryResults } from "./query-list-sort-select";
import { QueryDetails } from "./query-details";
import { QueryList } from "./query-list";
import { BattleDetailsSkeleton } from "./skeleton";
import { BattleHeader } from "./header";
import { motion } from "motion/react";
import { useQueryState } from "@/hooks/use-query-state";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

function EditableBattleLabel({
  battleId,
  label,
  canEdit,
}: {
  battleId: string;
  label: string;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const updateLabelMutation = trpc.battle.updateLabel.useMutation({
    onSuccess: () => {
      utils.battle.getById.invalidate({ id: battleId });
      utils.battle.getAll.invalidate();
      setIsEditing(false);
    },
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editedLabel.trim() && editedLabel !== label) {
      updateLabelMutation.mutate({ battleId, label: editedLabel.trim() });
    } else {
      setIsEditing(false);
      setEditedLabel(label);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedLabel(label);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Input
          ref={inputRef}
          value={editedLabel}
          onChange={(e) => setEditedLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleCancel}
          className="text-2xl font-bold h-10 max-w-md"
          disabled={updateLabelMutation.isPending}
        />
        <Button
          size="icon"
          variant="ghost"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSave}
          disabled={updateLabelMutation.isPending}
          className="h-8 w-8"
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCancel}
          disabled={updateLabelMutation.isPending}
          className="h-8 w-8"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-2 group"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <h1 className="text-2xl font-bold text-gray-900">{label}</h1>
      {canEdit && (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="h-3.5 w-3.5 text-gray-500" />
        </Button>
      )}
    </motion.div>
  );
}

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
        <EditableBattleLabel
          battleId={battleId}
          label={battle.label}
          canEdit={battle.canEdit}
        />
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
