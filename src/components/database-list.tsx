"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

      <div className="flex flex-wrap gap-3 min-h-[92px]">
        {databases?.map((database) => (
          <div key={database.id}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <h3 className="font-medium text-xs truncate">
                      {database.label}
                    </h3>
                    <ProviderBadge provider={database.provider} />
                  </div>
                  {/* Database actions */}
                  {isAdmin && (
                    <div className="flex space-x-0.5 ml-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 cursor-pointer"
                        onClick={() => duplicateDatabase({ id: database.id })}
                        title="Duplicate database"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 cursor-pointer"
                        onClick={() => {
                          setEditingDatabaseId(database.id);
                          setShowDatabaseModal(true);
                        }}
                        title="Edit database"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 cursor-pointer"
                        onClick={() => deleteDatabase({ id: database.id })}
                        title="Delete database"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
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
