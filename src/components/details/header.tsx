import { trpc } from "@/api/trpc/client";
import { Trophy, Link2, Check } from "lucide-react";
import { motion } from "motion/react";
import { ProviderBadge } from "../provider-badge";
import { Checkbox } from "../ui/checkbox";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { SimpleTooltip } from "../ui/simple-tooltip";
import { Button } from "../ui/button";
import { useState } from "react";
import { PROVIDERS, isValidProvider } from "@/lib/providers";

export const BattleHeader = ({ battleId }: { battleId: string }) => {
  const { data: battle } = trpc.battle.getById.useQuery({ id: battleId });

  if (!battle) return;

  const db1Color = isValidProvider(battle.database1.provider)
    ? PROVIDERS[battle.database1.provider].color
    : undefined;
  const db2Color = isValidProvider(battle.database2.provider)
    ? PROVIDERS[battle.database2.provider].color
    : undefined;

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
      <div className="text-2xl font-bold" style={{ color: db1Color?.["600"] }}>
        {Number(battle.meanScoreDb1) === -1 ? undefined : battle.meanScoreDb1}
      </div>
      <div className="text-2xl font-bold text-gray-600">vs</div>
      <div className="text-2xl font-bold" style={{ color: db2Color?.["600"] }}>
        {Number(battle.meanScoreDb2) === -1 ? undefined : battle.meanScoreDb2}
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

      {(() => {
        const metadata = battle.metadata as any;
        const totalCost = metadata?.usage?.totalCost;
        if (totalCost !== undefined) {
          return (
            <div className="ml-4 text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">
              ${Number(totalCost).toFixed(6)}
            </div>
          );
        }
      })()}

      <CopyLinkButton />
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

const CopyLinkButton = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const currentUrl = window.location.href;
    // Replace localhost:* with production URL
    const productionUrl = currentUrl.replace(
      /http:\/\/localhost:\d+/,
      "https://searcharena.vercel.app",
    );

    navigator.clipboard.writeText(productionUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <SimpleTooltip content="Copy link to share this battle">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="ml-2"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" />
            Copied!
          </>
        ) : (
          <>
            <Link2 className="h-3 w-3" />
            Copy Link
          </>
        )}
      </Button>
    </SimpleTooltip>
  );
};
