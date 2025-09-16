"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Clock,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCallback, useEffect, useMemo, useState } from "react";
import { trpc } from "@/api/trpc/client";
import { BattleResult } from "@/api/trpc";
import { ProviderBadge } from "./provider-badge";
import { SimpleTooltip } from "./ui/simple-tooltip";
import { motion, AnimatePresence } from "motion/react";
import { BattleSetupModal } from "./battle-setup-modal";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useRouter } from "next/navigation";

const emptyArray: BattleResult[] = [];

const useBattleTable = ({
  handleEditBattle,
  handleDeleteBattle,
  isDemo,
}: {
  handleEditBattle: (id: string) => void;
  handleDeleteBattle: (id: string) => void;
  isDemo: boolean;
}) => {
  const { isAdmin } = useIsAdmin();
  const { data: battleResults = emptyArray } = trpc.battle.getAll.useQuery({
    isDemo,
  });

  const columns: ColumnDef<BattleResult>[] = useMemo(
    () => [
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const getStatusConfig = (status: string) => {
            switch (status) {
              case "completed":
                return {
                  variant: "default" as const,
                  text: "Completed",
                };
              case "in_progress":
                return {
                  variant: "secondary" as const,
                  icon: <Loader2 className="h-3 w-3 animate-spin" />,
                  text: "Battle running",
                };
              case "pending":
                return {
                  variant: "outline" as const,
                  icon: <Clock className="h-3 w-3" />,
                  text: "Pending",
                };
              case "failed":
                return {
                  variant: "destructive" as const,
                  icon: <AlertTriangle className="h-3 w-3" />,
                  text: "Failed",
                };
              default:
                return {
                  variant: "outline" as const,
                  icon: <Clock className="h-3 w-3" />,
                  text: status,
                };
            }
          };

          const config = getStatusConfig(status);
          return (
            <SimpleTooltip content={row.original.error}>
              <Badge
                variant={config.variant}
                className="text-xs font-medium capitalize"
              >
                {config.icon}
                {config.text}
              </Badge>
            </SimpleTooltip>
          );
        },
      },
      {
        accessorKey: "label",
        header: "Battle",
        cell: ({ row }) => {
          const battle = row.original;
          return (
            <div className="flex flex-col space-y-1">
              <span className="font-medium text-sm">{battle.label}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "database1",
        header: "Database 1",
        cell: ({ row }) => {
          const db = row.original.database1;
          return (
            <div className="flex items-center space-x-2">
              <SimpleTooltip content={<ProviderBadge provider={db.provider} />}>
                <span className="text-sm font-medium truncate max-w-[400px]">
                  {db.label}
                </span>
              </SimpleTooltip>
            </div>
          );
        },
      },
      {
        accessorKey: "database2",
        header: "Database 2",
        cell: ({ row }) => {
          const db = row.original.database2;
          return (
            <div className="flex items-center space-x-2">
              <SimpleTooltip content={<ProviderBadge provider={db.provider} />}>
                <span className="text-sm font-medium truncate max-w-[400px]">
                  {db.label}
                </span>
              </SimpleTooltip>
            </div>
          );
        },
      },
      {
        header: "Query Count",
        cell: ({ row }) => {
          const battle = row.original;
          return (
            <span className="text-sm text-gray-700">
              {battle.queries.split("\n").length}
            </span>
          );
        },
      },
      {
        accessorKey: "results",
        header: "Results",
        cell: ({ row }) => {
          const battle = row.original;
          const score1 = battle.meanScoreDb1
            ? parseFloat(battle.meanScoreDb1)
            : 0;
          const score2 = battle.meanScoreDb2
            ? parseFloat(battle.meanScoreDb2)
            : 0;

          if (
            battle.status !== "completed" ||
            battle.meanScoreDb1 === null ||
            battle.meanScoreDb1 === undefined ||
            battle.meanScoreDb2 === null ||
            battle.meanScoreDb2 === undefined
          ) {
            return <span className="text-xs text-gray-400">-</span>;
          }

          // Check if both scores are -1 (LLM disabled)
          const isLLMDisabled = score1 === -1 && score2 === -1;

          return (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-bold text-blue-600">
                  {score1 === -1 ? "-" : battle.meanScoreDb1}
                </span>
                {!isLLMDisabled && score1 > score2 && (
                  <Trophy className="h-3 w-3 text-yellow-500" />
                )}
              </div>
              <span className="text-xs text-gray-400">vs</span>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-bold text-green-600">
                  {score2 === -1 ? "-" : battle.meanScoreDb2}
                </span>
                {!isLLMDisabled && score2 > score1 && (
                  <Trophy className="h-3 w-3 text-yellow-500" />
                )}
                {!isLLMDisabled && score1 === score2 && (
                  <Trophy className="h-3 w-3 text-gray-400" />
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
          const createdAt = row.original.createdAt;
          return (
            <span className="text-xs text-gray-500">
              {/* With time */}
              {createdAt ? new Date(createdAt).toLocaleString() : "Unknown"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const battle = row.original;

          return (
            <div className="flex items-center space-x-2">
              <SimpleTooltip content="Edit & Re-run">
                <Button
                  variant="ghost"
                  onClick={() => handleEditBattle(battle.id)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                </Button>
              </SimpleTooltip>
              {(!isDemo || isAdmin) && (
                <SimpleTooltip content="Delete Battle">
                  <Button
                    variant="ghost"
                    onClick={() => handleDeleteBattle(battle.id)}
                    className="hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                  </Button>
                </SimpleTooltip>
              )}
            </div>
          );
        },
      },
    ],
    [isDemo, isAdmin, handleEditBattle, handleDeleteBattle]
  );

  const table = useReactTable<BattleResult>({
    getRowId: (row) => row.id,
    data: battleResults,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return table;
};

export default function BattleResultsDataTable({
  isDemo,
}: {
  isDemo: boolean;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const { data: battleResults, isLoading } = trpc.battle.getAll.useQuery(
    {
      isDemo,
    },
    {
      refetchInterval: shouldRefetch ? 4000 : undefined,
    }
  );
  console.log("isLoading", isLoading);
  useEffect(() => {
    if (isDemo) return;

    setShouldRefetch(
      battleResults?.some(
        (battle) =>
          battle.status === "in_progress" || battle.status === "pending"
      ) ?? false
    );
  }, [battleResults, isDemo]);

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

  const handleNewBattle = useCallback(() => {
    setEditBattleData({
      open: true,
      data: null,
    });
  }, []);

  const handleDeleteBattle = useCallback(
    (id: string) => {
      deleteBattleMutation.mutate({ battleId: id });
    },
    [deleteBattleMutation]
  );

  const table = useBattleTable({
    handleEditBattle,
    handleDeleteBattle,
    isDemo,
  });

  return (
    <div className="w-full">
      <BattleSetupModal
        open={editBattleData.open}
        onClose={() => setEditBattleData({ open: false, data: null })}
        initialData={editBattleData.data || undefined}
      />
      {!isDemo && (
        <div className="flex items-center justify-between py-4">
          <Input
            placeholder="Filter battles..."
            value={(table.getColumn("label")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("label")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleNewBattle}>
              <Plus /> New Battle
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                utils.battle.getAll.invalidate();
              }}
            >
              {trpc.battle.getAll.useQuery({ isDemo }).isFetching ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RefreshCw />
              )}
            </Button>
          </div>
        </div>
      )}
      <div className="rounded-md border">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton-table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="h-12">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          ) : (
            <motion.div
              key="real-table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="hover:bg-gray-100 cursor-pointer"
                        onClick={(e) => {
                          // Prevent navigation if the click is on the action buttons
                          if (
                            e.target instanceof HTMLElement &&
                            e.target.closest("button")
                          )
                            return;
                          router.push(`/battle/${row.original.id}`);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="p-2">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9999} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
