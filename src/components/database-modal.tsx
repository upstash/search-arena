"use client";

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/api/trpc/client";
import { ProviderBadge } from "./provider-badge";
import { Database } from "@/api/trpc/types";
import { Loader2Icon } from "lucide-react";

interface DatabaseModalProps {
  open: boolean;
  onClose: () => void;
  database?: Database; // If provided, we're editing; if not, we're adding
}

// Form data type
type FormData = {
  label: string;
  provider: "upstash_search" | "algolia";
  credentials: string;
};

// Provider templates
const PROVIDER_TEMPLATES = {
  upstash_search: `UPSTASH_URL=https://your-database.upstash.io
UPSTASH_TOKEN=your-rest-token
UPSTASH_INDEX=your-index-name
UPSTASH_TOPK=10
UPSTASH_RERANKING=true
UPSTASH_INPUT_ENRICHMENT=true`,
  algolia: `ALGOLIA_APPLICATION_ID=your-app-id
ALGOLIA_API_KEY=your-api-key
ALGOLIA_INDEX=your-index-name`,
};

export function DatabaseModal({ open, onClose, database }: DatabaseModalProps) {
  const isEditing = !!database;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      label: database?.label || "",
      provider:
        (database?.provider as "upstash_search" | "algolia") ||
        "upstash_search",
      credentials: database?.credentials || PROVIDER_TEMPLATES.upstash_search,
    },
  });

  useEffect(() => {
    if (!open) return;

    if (database) {
      reset({
        label: database.label || "",
        provider:
          (database.provider as "upstash_search" | "algolia") ||
          "upstash_search",
        credentials:
          database.credentials ||
          PROVIDER_TEMPLATES[
            database.provider as "upstash_search" | "algolia"
          ] ||
          PROVIDER_TEMPLATES.upstash_search,
      });
    } else {
      reset();
    }
  }, [database, open, reset]);

  const watchedProvider = watch("provider");

  const utils = trpc.useUtils();
  const { mutateAsync: createDatabase, isPending: isCreating } =
    trpc.database.create.useMutation({
      onSuccess: () => {
        utils.database.getAll.invalidate();
        onClose();

        // Reset form only when adding (not editing)
        if (!isEditing) {
          reset({
            label: "",
            provider: "upstash_search",
            credentials: PROVIDER_TEMPLATES.upstash_search,
          });
        }
      },
    });

  const { mutateAsync: updateDatabase, isPending: isUpdating } =
    trpc.database.update.useMutation({
      onSuccess: () => {
        utils.database.getAll.invalidate();
        onClose();
      },
    });

  // Update credentials when provider changes (only for add mode)
  useEffect(() => {
    if (!isEditing) {
      setValue("credentials", PROVIDER_TEMPLATES[watchedProvider]);
    }
  }, [watchedProvider, setValue, isEditing]);

  // Reset form when database changes (for edit mode)
  useEffect(() => {
    if (database) {
      reset({
        label: database.label || "",
        provider:
          (database.provider as "upstash_search" | "algolia") ||
          "upstash_search",
        credentials:
          database.credentials ||
          PROVIDER_TEMPLATES[
            database.provider as "upstash_search" | "algolia"
          ] ||
          PROVIDER_TEMPLATES.upstash_search,
      });
    }
  }, [database, reset]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (isEditing && database) {
      await updateDatabase({
        id: database.id,
        label: data.label,
        credentials: data.credentials,
      });
    } else {
      await createDatabase({
        label: data.label,
        provider: data.provider,
        credentials: data.credentials,
      });
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[700px] max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{isEditing ? "Edit Database" : "Add Database"}</span>
            {isEditing && database && (
              <ProviderBadge provider={database.provider} />
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-4">
          <div className="min-w-0">
            <Label htmlFor="label" className="mb-1">
              Label
            </Label>
            <Input
              id="label"
              {...register("label", { required: "Label is required" })}
              placeholder="e.g., upstash-search v1.4"
              aria-invalid={errors.label ? "true" : "false"}
            />
            {errors.label && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {errors.label.message}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <Label htmlFor="provider" className="mb-1">
              Provider
            </Label>
            <Controller
              name="provider"
              control={control}
              rules={{ required: "Provider is required" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upstash_search">
                      Upstash Search
                    </SelectItem>
                    <SelectItem value="algolia">Algolia</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.provider && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {errors.provider.message}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <Label htmlFor="credentials">Config</Label>
            <p className="text-sm text-gray-600 mb-2">
              Enter your config in environment variable format:
            </p>
            <Textarea
              id="credentials"
              {...register("credentials", {
                required: "Config is required",
              })}
              placeholder={PROVIDER_TEMPLATES[watchedProvider]}
              className="h-32 font-mono text-sm whitespace-nowrap overflow-x-scroll"
              aria-invalid={errors.credentials ? "true" : "false"}
            />
            {errors.credentials && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {errors.credentials.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isLoading && <Loader2Icon className="animate-spin" />}
              {isEditing
                ? isLoading
                  ? "Updating"
                  : "Update"
                : isLoading
                  ? "Adding"
                  : "Add"}{" "}
              {!isLoading && "Database"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Backward compatibility export
export const AddDatabaseModal = DatabaseModal;
