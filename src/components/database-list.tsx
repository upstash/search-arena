"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Settings, Trash2, Copy } from "lucide-react";
import { DatabaseModal } from "./database-modal";
import { trpc } from "@/api/trpc/client";

import { ProviderBadge } from "./provider-badge";
import { useIsAdmin } from "@/hooks/use-is-admin";

export function DatabaseList() {
  const { isAdmin } = useIsAdmin();
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [editingDatabaseId, setEditingDatabaseId] = useState<
    string | undefined
  >();

  const { data: databases } = trpc.database.getAll.useQuery();
  const utils = trpc.useUtils();
  const { mutate: deleteDatabase } = trpc.database.delete.useMutation({
    onSuccess: () => {
      utils.database.getAll.invalidate();
    },
  });
  const { mutate: duplicateDatabase } = trpc.database.duplicate.useMutation({
    onSuccess: () => {
      utils.database.getAll.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Databases</h2>
          <p className="text-sm text-gray-600">
            Manage your search database connections
          </p>
        </div>
        <div>
          <Button
            onClick={() => {
              setShowDatabaseModal(true);
              setEditingDatabaseId(undefined);
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Database
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Created At</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {databases?.length ? (
              databases.map((database) => (
                <TableRow key={database.id}>
                  <TableCell className="font-medium">
                    {database.label}
                  </TableCell>
                  <TableCell>
                    <ProviderBadge provider={database.provider} />
                  </TableCell>
                  <TableCell>
                    {database.createdAt
                      ? new Date(database.createdAt).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                duplicateDatabase({ id: database.id })
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicate</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditingDatabaseId(database.id);
                                setShowDatabaseModal(true);
                              }}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                deleteDatabase({ id: database.id })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 4 : 3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No databases configured yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DatabaseModal
        open={showDatabaseModal}
        onClose={() => {
          setShowDatabaseModal(false);
        }}
        database={databases?.find((db) => db.id === editingDatabaseId)}
      />
    </div>
  );
}
