"use client";

import { DatabaseList } from "@/components/database-list";
import { BattleResults } from "@/components/battle-results";
import { useIsAdmin } from "@/hooks/use-is-admin";

export default function Page() {
  const { isAdmin } = useIsAdmin();
  return (
    <div className="space-y-8">
      {isAdmin && <DatabaseList />}
      <BattleResults isDemo={false} />
      <BattleResults isDemo />
    </div>
  );
}
