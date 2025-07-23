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
import { Loader2Icon } from "lucide-react";

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
  queries: string;
};

export function BattleSetupModal({
  open,
  onClose,
  initialData,
}: BattleSetupModalProps) {
  const isEditing = !!initialData;
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      label: initialData?.label,
      databaseId1: initialData?.databaseId1,
      databaseId2: initialData?.databaseId2,
      queries: initialData?.queries,
    },
  });
  const { data: databases } = trpc.database.getAll.useQuery();

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      reset({
        label: initialData.label,
        databaseId1: initialData.databaseId1,
        databaseId2: initialData.databaseId2,
        queries: initialData.queries,
      });
    } else if (
      databases &&
      (databases.length === 2 || databases.length === 1)
    ) {
      reset({
        label: "",
        databaseId1: databases.at(0)?.id,
        databaseId2: databases.at(1)?.id,
        queries: "",
      });
    } else {
      reset();
    }
  }, [initialData, open, reset, databases]);

  const utils = trpc.useUtils();
  const { mutateAsync: createBattle, isPending: isCreating } =
    trpc.battle.create.useMutation({
      onSuccess: () => {
        utils.battle.getAll.invalidate();
        onClose();
      },
    });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    await createBattle({
      label: data.label,
      databaseId1: data.databaseId1,
      databaseId2: data.databaseId2,
      queries: data.queries,
    });
  };

  const isLoading = isCreating;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
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
              placeholder="e.g., Product Search Test"
              aria-invalid={errors.label ? "true" : "false"}
            />
            {errors.label && (
              <p className="text-sm text-red-500 mt-1" role="alert">
                {errors.label.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="databaseId1" className="mb-1">
                Database 1
              </Label>
              <Controller
                name="databaseId1"
                control={control}
                rules={{ required: "Database 1 is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select database" />
                    </SelectTrigger>
                    <SelectContent>
                      {databases?.map((db) => (
                        <SelectItem key={db.id} value={db.id}>
                          {db.label}
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
            </div>
            <div>
              <Label htmlFor="databaseId2" className="mb-1">
                Database 2
              </Label>
              <Controller
                name="databaseId2"
                control={control}
                rules={{ required: "Database 2 is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select database" />
                    </SelectTrigger>
                    <SelectContent>
                      {databases?.map((db) => (
                        <SelectItem key={db.id} value={db.id}>
                          {db.label}
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
              className="h-[400px]"
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
            <Button type="submit" disabled={isLoading}>
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
