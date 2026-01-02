"use client";

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
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
import { ConfigEditor } from "@/components/config-editor";
import { trpc } from "@/api/trpc/client";
import { ProviderBadge } from "./provider-badge";
import { Database } from "@/api/trpc/types";
import { Loader2Icon, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsAdmin } from "@/hooks/use-is-admin";
import {
  validateCredentials,
  PROVIDERS,
  Provider,
  PROVIDER_KEYS,
  DEFAULT_PROVIDER,
  isValidProvider,
} from "@/lib/providers";

interface DatabaseModalProps {
  open: boolean;
  onClose: () => void;
  database?: Database; // If provided, we're editing; if not, we're adding
}

// Form data type
type FormData = {
  label: string;
  provider: Provider;
  credentials: string;
  devOnly: boolean;
};

// Generate credential templates from PROVIDERS registry
const CREDENTIAL_TEMPLATES: Record<Provider, string> = {
  upstash_search: JSON.stringify(
    {
      url: "https://your-database.upstash.io",
      token: "your-rest-token",
      defaultNamespace: "optional-namespace",
    },
    null,
    2,
  ),
  algolia: JSON.stringify(
    {
      applicationId: "your-app-id",
      apiKey: "your-api-key",
      defaultIndex: "your-index-name",
    },
    null,
    2,
  ),
};

function getCredentialTemplate(provider: string): string {
  if (isValidProvider(provider)) {
    return CREDENTIAL_TEMPLATES[provider];
  }
  return "{}";
}

export function DatabaseModal({ open, onClose, database }: DatabaseModalProps) {
  const isEditing = !!database;
  const { isAdmin } = useIsAdmin();
  const [jsonError, setJsonError] = useState<string | null>(null);
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
      provider: database?.provider || DEFAULT_PROVIDER,
      credentials:
        database?.credentials ||
        getCredentialTemplate(database?.provider || DEFAULT_PROVIDER),
      devOnly: database?.devOnly ?? true,
    },
  });

  useEffect(() => {
    if (!open) return;

    if (database) {
      reset({
        label: database.label || "",
        provider: database.provider || DEFAULT_PROVIDER,
        credentials:
          database.credentials || getCredentialTemplate(database.provider),
        devOnly: database.devOnly ?? true,
      });
    } else {
      reset();
    }
    setJsonError(null);
  }, [database, open, reset]);

  const watchedProvider = watch("provider");
  const watchedCredentials = watch("credentials");

  // Validate JSON on change
  useEffect(() => {
    if (watchedCredentials) {
      const error = validateCredentials(watchedProvider, watchedCredentials);
      setJsonError(error);
    }
  }, [watchedCredentials, watchedProvider]);

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
            provider: DEFAULT_PROVIDER,
            credentials: getCredentialTemplate(DEFAULT_PROVIDER),
            devOnly: true,
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

  // Update credentials template when provider changes (only for add mode)
  useEffect(() => {
    if (!isEditing) {
      setValue("credentials", getCredentialTemplate(watchedProvider));
    }
  }, [watchedProvider, setValue, isEditing]);

  // Reset form when database changes (for edit mode)
  useEffect(() => {
    if (database) {
      reset({
        label: database.label || "",
        provider: database.provider || DEFAULT_PROVIDER,
        credentials:
          database.credentials || getCredentialTemplate(database.provider),
        devOnly: database.devOnly ?? true,
      });
    }
  }, [database, reset]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    // Validate JSON before submitting
    const error = validateCredentials(data.provider, data.credentials);
    if (error) {
      setJsonError(error);
      return;
    }

    if (isEditing && database) {
      await updateDatabase({
        id: database.id,
        label: data.label,
        credentials: JSON.parse(data.credentials),
        devOnly: data.devOnly,
      });
    } else {
      await createDatabase({
        label: data.label,
        provider: data.provider,
        credentials: JSON.parse(data.credentials),
        devOnly: data.devOnly,
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
                    {PROVIDER_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {PROVIDERS[key].name}
                      </SelectItem>
                    ))}
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
            <Label htmlFor="credentials">Credentials (JSON)</Label>
            <p className="text-sm text-gray-600 mb-2">
              Enter your credentials in JSON format:
            </p>
            <Controller
              name="credentials"
              control={control}
              rules={{ required: "Credentials are required" }}
              render={({ field }) => (
                <ConfigEditor
                  value={field.value}
                  onChange={field.onChange}
                  height="150px"
                />
              )}
            />
            {errors.credentials && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {errors.credentials.message}
              </p>
            )}
            {jsonError && (
              <p
                className="text-sm text-red-500 mt-1 flex items-center gap-1"
                role="alert"
              >
                <AlertCircle className="h-3 w-3" />
                {jsonError}
              </p>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2">
              <Controller
                name="devOnly"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="devOnly"
                    checked={!field.value}
                    onCheckedChange={(checked) => field.onChange(!checked)}
                  />
                )}
              />
              <Label
                htmlFor="devOnly"
                className="text-sm font-normal cursor-pointer"
              >
                Public (will be visible to everyone)
              </Label>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!!jsonError}>
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
