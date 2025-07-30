"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Settings, Trash2 } from "lucide-react";
import { DatabaseModal } from "./database-modal";
import { trpc } from "@/api/trpc/client";
import { motion, AnimatePresence } from "motion/react";
import { ProviderBadge } from "./provider-badge";

export function DatabaseList() {
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

  return (
    <div className="space-y-6">
      <motion.div
        className="flex justify-between items-center mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <motion.h2
            className="text-xl font-bold text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Databases
          </motion.h2>
          <motion.p
            className="text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Manage your search database connections
          </motion.p>
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
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
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 min-h-[92px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence>
          {databases?.map((database, index) => (
            <motion.div
              key={database.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="">
                  <div className="flex justify-between items-center">
                    <motion.div
                      className="flex-1 min-w-0 flex flex-col gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <h3 className="font-medium text-xs truncate">
                        {database.label}
                      </h3>
                      <ProviderBadge provider={database.provider} />
                    </motion.div>
                    <motion.div
                      className="flex space-x-0.5 ml-1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 cursor-pointer"
                        onClick={() => {
                          setEditingDatabaseId(database.id);
                          setShowDatabaseModal(true);
                        }}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 cursor-pointer"
                        onClick={() => deleteDatabase({ id: database.id })}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

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
