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
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCallback, useMemo, useState } from "react";
import { BattleSetupModal } from "./battle-setup-modal";
import { trpc } from "@/api/trpc/client";
import { BattleResult, router } from "@/api/trpc";
import { motion } from "motion/react";
import { ProviderBadge } from "./provider-badge";
import { SimpleTooltip } from "./ui/simple-tooltip";
import { useRouter } from "next/navigation";

const emptyArray: BattleResult[] = [];

const useBattleTable = ({
  handleEditBattle,
}: {
  handleEditBattle: (id: string) => void;
}) => {
  const { data: battleResults = emptyArray } = trpc.battle.getAll.useQuery();

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
                  text: "In Progress",
                };
              case "pending":
                return {
                  variant: "outline" as const,
                  icon: <Loader2 className="h-3 w-3 animate-spin" />,
                  text: "Battle running",
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
            <Badge
              variant={config.variant}
              className="text-xs font-medium capitalize"
            >
              {config.icon}
              {config.text}
            </Badge>
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
                <span className="text-sm font-medium truncate max-w-[120px]">
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
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {db.label}
                </span>
              </SimpleTooltip>
            </div>
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
            !battle.meanScoreDb1 ||
            !battle.meanScoreDb2
          ) {
            return <span className="text-xs text-gray-400">-</span>;
          }

          return (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-bold text-blue-600">
                  {battle.meanScoreDb1}
                </span>
                {score1 > score2 && (
                  <motion.div
                    initial={{ rotate: 30, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                  >
                    <Trophy className="h-3 w-3 text-yellow-500" />
                  </motion.div>
                )}
              </div>
              <span className="text-xs text-gray-400">vs</span>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-bold text-green-600">
                  {battle.meanScoreDb2}
                </span>
                {score2 > score1 && (
                  <motion.div
                    initial={{ rotate: 30, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                  >
                    <Trophy className="h-3 w-3 text-yellow-500" />
                  </motion.div>
                )}
                {score1 === score2 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Trophy className="h-3 w-3 text-gray-400" />
                  </motion.div>
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
            </div>
          );
        },
      },
    ],
    [handleEditBattle]
  );

  const table = useReactTable<BattleResult>({
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

export function BattleResultsDataTable() {
  const { data: battleResults } = trpc.battle.getAll.useQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBattleId, setEditingBattleId] = useState<string | undefined>(
    undefined
  );
  const router = useRouter();

  const handleEditBattle = useCallback((id: string) => {
    setEditingBattleId(id);
    setModalOpen(true);
  }, []);

  const table = useBattleTable({
    handleEditBattle,
  });

  return (
    <div className="w-full">
      <BattleSetupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={
          editingBattleId
            ? battleResults?.find((d) => d.id === editingBattleId)
            : undefined
        }
      />

      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter battles..."
          value={(table.getColumn("label")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("label")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <Button
          variant="outline"
          onClick={(e) => {
            setModalOpen(true);
            setEditingBattleId(undefined);
          }}
        >
          <Plus /> New Battle
        </Button>
      </div>
      <div className="rounded-md border">
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
                  className="cursor-pointer hover:bg-gray-100"
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={(e) => {
                    if (e.target instanceof HTMLButtonElement) return;
                    router.push(`/battle/${row.original.id}`);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
      </div>
    </div>
  );
}
