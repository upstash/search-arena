import { trpc } from "@/api/trpc/client";
import { Trophy } from "lucide-react";
import { motion } from "motion/react";
import { ProviderBadge } from "../provider-badge";
import { Checkbox } from "../ui/checkbox";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Tooltip } from "../ui/tooltip";
import { SimpleTooltip } from "../ui/simple-tooltip";

export const BattleHeader = ({ battleId }: { battleId: string }) => {
  const { data: battle } = trpc.battle.getById.useQuery({ id: battleId });

  if (!battle) return;

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">{battle.database1.label}</span>
        <ProviderBadge provider={battle.database1.provider} />
        {battle.meanScoreDb1 &&
          battle.meanScoreDb2 &&
          battle.meanScoreDb1 > battle.meanScoreDb2 && (
            <Trophy className="h-3 w-3 text-yellow-500" />
          )}
      </div>
      <div className="text-2xl font-bold text-blue-600">
        {battle.meanScoreDb1 === "-1" ? "-" : battle.meanScoreDb1}
      </div>
      <div className="text-2xl font-bold text-gray-600">vs</div>
      <div className="text-2xl font-bold text-green-600">
        {battle.meanScoreDb2 === "-1" ? "-" : battle.meanScoreDb2}
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">{battle.database2.label}</span>
        <ProviderBadge provider={battle.database2.provider} />
        {battle.meanScoreDb2 &&
          battle.meanScoreDb1 &&
          battle.meanScoreDb2 > battle.meanScoreDb1 && (
            <Trophy className="h-3 w-3 text-yellow-500" />
          )}
        {battle.meanScoreDb1 === battle.meanScoreDb2 && (
          <Trophy className="h-3 w-3 text-gray-400" />
        )}
      </div>

      <BattleDemoCheckbox battleId={battleId} />
    </motion.div>
  );
};

export const BattleDemoCheckbox = ({ battleId }: { battleId: string }) => {
  const { isAdmin } = useIsAdmin();
  const utils = trpc.useUtils();
  const { mutate, isPending } = trpc.battle.edit.useMutation({
    onSuccess: () => {
      utils.battle.getById.invalidate({ id: battleId });
      utils.battle.getAll.invalidate();
    },
  });

  const { data: battle, isLoading } = trpc.battle.getById.useQuery({
    id: battleId,
  });

  // Hide the checkbox if user is not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <SimpleTooltip content="Show this search result in the main page, under examples.">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="demo"
          className="cursor-pointer"
          disabled={isLoading || isPending}
          checked={battle?.isDemo ?? "indeterminate"}
          onCheckedChange={(checked) =>
            mutate({ battleId, isDemo: checked === true })
          }
        />
        <label htmlFor="demo">Example</label>
      </div>
    </SimpleTooltip>
  );
};
