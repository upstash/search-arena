"use client";

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { CostEstimate } from "./cost-estimate";
import { trpc } from "@/api/trpc/client";
import { AlertCircle, Info, Loader2Icon } from "lucide-react";
import {
  getDefaultConfig,
  validateSearchConfig,
  isValidProvider,
} from "@/lib/providers";

interface BattleSetupModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    databaseId1: string;
    databaseId2: string;
    queries: string;
    config1?: string;
    config2?: string;
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
  ratingCount: number;
};

// Get default config as JSON string for a provider
function getDefaultConfigJson(provider: string | undefined): string {
  if (!provider || !isValidProvider(provider)) {
    return "{}";
  }
  return JSON.stringify(getDefaultConfig(provider), null, 2);
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
      ratingCount: 1,
    },
  });
  const { data: databases, isLoading: isDatabasesLoading } =
    trpc.database.getAll.useQuery();

  // Watch database selections to determine providers
  const watchedDatabaseId1 = watch("databaseId1");
  const watchedDatabaseId2 = watch("databaseId2");
  const watchedConfig1 = watch("config1");
  const watchedConfig2 = watch("config2");
  const watchedQueries = watch("queries");
  const watchedRatingCount = watch("ratingCount");

  // Get providers for selected databases
  const db1Provider = useMemo(() => {
    const db = databases?.find((d) => d.id === watchedDatabaseId1);
    return db?.provider;
  }, [databases, watchedDatabaseId1]);

  const db2Provider = useMemo(() => {
    const db = databases?.find((d) => d.id === watchedDatabaseId2);
    return db?.provider;
  }, [databases, watchedDatabaseId2]);

  // Track if we're in initial edit mode to avoid overwriting initialData configs
  const skipConfigUpdateRef = useRef<{ db1: boolean; db2: boolean }>({
    db1: false,
    db2: false,
  });

  // Update default configs when database selection changes (but not on initial edit load)
  useEffect(() => {
    if (db1Provider) {
      if (skipConfigUpdateRef.current.db1) {
        // Skip this update - we just loaded initialData
        skipConfigUpdateRef.current.db1 = false;
      } else {
        setValue("config1", getDefaultConfigJson(db1Provider));
        setConfig1Error(null);
      }
    }
  }, [db1Provider, setValue]);

  useEffect(() => {
    if (db2Provider) {
      if (skipConfigUpdateRef.current.db2) {
        // Skip this update - we just loaded initialData
        skipConfigUpdateRef.current.db2 = false;
      } else {
        setValue("config2", getDefaultConfigJson(db2Provider));
        setConfig2Error(null);
      }
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
    if (!open) {
      // Reset the skip flags when modal closes
      skipConfigUpdateRef.current = { db1: false, db2: false };
      return;
    }

    // When modal opens, set initial values
    if (initialData) {
      // Edit mode: use initial data, including configs if provided
      // Set skip flags so the provider-change effects don't overwrite our configs
      if (initialData.config1) {
        skipConfigUpdateRef.current.db1 = true;
      }
      if (initialData.config2) {
        skipConfigUpdateRef.current.db2 = true;
      }

      const db1 = databases?.find((d) => d.id === initialData.databaseId1);
      const db2 = databases?.find((d) => d.id === initialData.databaseId2);
      reset({
        label: initialData.label,
        databaseId1: initialData.databaseId1,
        databaseId2: initialData.databaseId2,
        config1: initialData.config1 ?? getDefaultConfigJson(db1?.provider),
        config2: initialData.config2 ?? getDefaultConfigJson(db2?.provider),
        queries: initialData.queries,
        ratingCount: 1,
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
        ratingCount: 1,
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
        ratingCount: 1,
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
      ratingCount: data.ratingCount,
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
              {v1Databases.length === 0 ? (
                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground bg-muted/50 rounded-md border border-dashed">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span>
                    No databases available. Please add a database first.
                  </span>
                </div>
              ) : (
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
              )}
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
              {v1Databases.length === 0 ? (
                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground bg-muted/50 rounded-md border border-dashed">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span>
                    No databases available. Please add a database first.
                  </span>
                </div>
              ) : (
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
              )}
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

          <div>
            <Label htmlFor="ratingCount" className="mb-1">
              Ratings per Query (to average out variance)
            </Label>
            <Controller
              name="ratingCount"
              control={control}
              rules={{ required: "Rating count is required" }}
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select rating count..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Fastest)</SelectItem>
                    <SelectItem value="3">3 (More Accurate)</SelectItem>
                    <SelectItem value="5">5 (Very Accurate)</SelectItem>
                    <SelectItem value="10">
                      10 (Most Accurate - Slow)
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Cost Estimate */}
          <CostEstimate
            queries={watchedQueries || ""}
            ratingCount={watchedRatingCount || 1}
          />

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
