"use client";

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProviderBadge } from "./provider-badge";
import { Textarea } from "@/components/ui/textarea";
import { ConfigEditor } from "./config-editor";
import { trpc } from "@/api/trpc/client";
import { AlertCircle, Loader2Icon } from "lucide-react";
import {
  DEFAULT_UPSTASH_CONFIG,
  DEFAULT_ALGOLIA_CONFIG,
} from "@/lib/schemas/search-config";
import { validateSearchConfig } from "@/lib/schemas/validation";

interface BattleSetupModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    databaseId1: string;
    databaseId2: string;
    queries: string;
  };
}

// Form data type
type FormData = {
  label: string;
  databaseId1: string;
  databaseId2: string;
  config1: string; // JSON string
  config2: string; // JSON string
  queries: string;
};

// Get default config as JSON string for a provider
function getDefaultConfigJson(
  provider: "upstash_search" | "algolia" | undefined
): string {
  if (provider === "upstash_search") {
    return JSON.stringify(DEFAULT_UPSTASH_CONFIG, null, 2);
  } else if (provider === "algolia") {
    return JSON.stringify(DEFAULT_ALGOLIA_CONFIG, null, 2);
  }
  return "{}";
}

export function BattleSetupModal({
  open,
  onClose,
  initialData,
}: BattleSetupModalProps) {
  const [config1Error, setConfig1Error] = useState<string | null>(null);
  const [config2Error, setConfig2Error] = useState<string | null>(null);

  const {
    watch,
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      label: initialData?.label,
      databaseId1: initialData?.databaseId1,
      databaseId2: initialData?.databaseId2,
      config1: "{}",
      config2: "{}",
      queries: initialData?.queries,
    },
  });
  const { data: databases, isLoading: isDatabasesLoading } =
    trpc.database.getAll.useQuery();

  // Watch database selections to determine providers
  const watchedDatabaseId1 = watch("databaseId1");
  const watchedDatabaseId2 = watch("databaseId2");
  const watchedConfig1 = watch("config1");
  const watchedConfig2 = watch("config2");

  // Get providers for selected databases
  const db1Provider = useMemo(() => {
    const db = databases?.find((d) => d.id === watchedDatabaseId1);
    return db?.provider;
  }, [databases, watchedDatabaseId1]);

  const db2Provider = useMemo(() => {
    const db = databases?.find((d) => d.id === watchedDatabaseId2);
    return db?.provider;
  }, [databases, watchedDatabaseId2]);

  // Update default configs when database selection changes
  useEffect(() => {
    if (db1Provider) {
      setValue("config1", getDefaultConfigJson(db1Provider));
      setConfig1Error(null);
    }
  }, [db1Provider, setValue]);

  useEffect(() => {
    if (db2Provider) {
      setValue("config2", getDefaultConfigJson(db2Provider));
      setConfig2Error(null);
    }
  }, [db2Provider, setValue]);

  // Validate configs on change
  useEffect(() => {
    if (watchedConfig1 && db1Provider) {
      console.log("Validation");
      setConfig1Error(validateSearchConfig(db1Provider, watchedConfig1));
    }
  }, [watchedConfig1, db1Provider]);

  useEffect(() => {
    if (watchedConfig2 && db2Provider) {
      setConfig2Error(validateSearchConfig(db2Provider, watchedConfig2));
    }
  }, [watchedConfig2, db2Provider]);

  useEffect(() => {
    if (!open) return;

    // When modal opens, set initial values
    if (initialData) {
      // Edit mode: use initial data
      const db1 = databases?.find((d) => d.id === initialData.databaseId1);
      const db2 = databases?.find((d) => d.id === initialData.databaseId2);
      reset({
        label: initialData.label,
        databaseId1: initialData.databaseId1,
        databaseId2: initialData.databaseId2,
        config1: getDefaultConfigJson(db1?.provider),
        config2: getDefaultConfigJson(db2?.provider),
        queries: initialData.queries,
      });
    } else if (databases?.length === 2) {
      // New battle with exactly 2 databases: pre-select them
      reset({
        label: "",
        databaseId1: databases[0].id,
        databaseId2: databases[1].id,
        config1: getDefaultConfigJson(databases[0].provider),
        config2: getDefaultConfigJson(databases[1].provider),
        queries: "",
      });
    } else {
      // New battle: start fresh
      reset({
        label: "",
        databaseId1: "",
        databaseId2: "",
        config1: "{}",
        config2: "{}",
        queries: "",
      });
    }
  }, [open, reset, databases, initialData]);

  const utils = trpc.useUtils();
  const { mutateAsync: createBattle, isPending: isCreating } =
    trpc.battle.create.useMutation({
      onSuccess: () => {
        utils.battle.getAll.invalidate();
        onClose();
      },
    });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!db1Provider || !db2Provider)
      throw new Error("Providers not loaded yet");
    // Validate configs before submitting
    const error1 = validateSearchConfig(db1Provider, data.config1);
    const error2 = validateSearchConfig(db2Provider, data.config2);

    if (error1) {
      setConfig1Error(error1);
      return;
    }
    if (error2) {
      setConfig2Error(error2);
      return;
    }

    await createBattle({
      label: data.label,
      databaseId1: data.databaseId1,
      databaseId2: data.databaseId2,
      config1: JSON.parse(data.config1),
      config2: JSON.parse(data.config2),
      queries: data.queries,
    });
  };

  const isLoading = isCreating || isDatabasesLoading;
  const hasConfigErrors = !!config1Error || !!config2Error;

  // Filter to only v1 databases
  const v1Databases = useMemo(() => {
    return databases?.filter((db) => db.version === 1) || [];
  }, [databases]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit and Re-run Battle" : "New Battle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="label" className="mb-1">
              Battle Label
            </Label>
            <Input
              id="label"
              {...register("label", { required: "Label is required" })}
              placeholder="e.g., Action Movies"
              aria-invalid={errors.label ? "true" : "false"}
            />
            {errors.label && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {errors.label.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {/* Database 1 */}
            <div className="space-y-2">
              <Label htmlFor="databaseId1" className="mb-1">
                Database 1
              </Label>
              <Controller
                name="databaseId1"
                control={control}
                rules={{ required: "Database 1 is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select database..." />
                    </SelectTrigger>
                    <SelectContent>
                      {v1Databases.map((db) => (
                        <SelectItem key={db.id} value={db.id}>
                          <div className="flex items-center gap-2">
                            <span>{db.label}</span>
                            <ProviderBadge provider={db.provider} />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.databaseId1 && (
                <p className="text-sm text-red-500 mt-1" role="alert">
                  {errors.databaseId1.message}
                </p>
              )}

              {/* Config 1 */}
              {db1Provider && (
                <div className="mt-2">
                  <Label className="text-sm text-gray-600">Config (JSON)</Label>
                  <div className="mt-1">
                    <Controller
                      name="config1"
                      control={control}
                      render={({ field }) => (
                        <ConfigEditor
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  {config1Error && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {config1Error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Database 2 */}
            <div className="space-y-2">
              <Label htmlFor="databaseId2" className="mb-1">
                Database 2
              </Label>
              <Controller
                name="databaseId2"
                control={control}
                rules={{ required: "Database 2 is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select database..." />
                    </SelectTrigger>
                    <SelectContent>
                      {v1Databases.map((db) => (
                        <SelectItem key={db.id} value={db.id}>
                          <div className="flex items-center gap-2">
                            <span>{db.label}</span>
                            <ProviderBadge provider={db.provider} />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.databaseId2 && (
                <p className="text-sm text-red-500 mt-1" role="alert">
                  {errors.databaseId2.message}
                </p>
              )}

              {/* Config 2 */}
              {db2Provider && (
                <div className="mt-2">
                  <Label className="text-sm text-gray-600">Config (JSON)</Label>
                  <div className="mt-1">
                    <Controller
                      name="config2"
                      control={control}
                      render={({ field }) => (
                        <ConfigEditor
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  {config2Error && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {config2Error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="queries" className="mb-1">
              Queries (one per line)
            </Label>
            <Textarea
              id="queries"
              {...register("queries", { required: "Queries are required" })}
              placeholder="Enter search queries, one per line"
              className="h-[300px]"
              aria-invalid={errors.queries ? "true" : "false"}
            />
            {errors.queries && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {errors.queries.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || hasConfigErrors || !db1Provider || !db2Provider
              }
            >
              {isLoading && (
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isLoading ? "Starting" : "Start"} {!isLoading && "Battle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
