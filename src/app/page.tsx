"use client";

import { DatabaseList } from "@/components/database-list";
import { BattleResults } from "@/components/battle-results";

export default function Page() {
  return (
    <div className="space-y-8">
      <DatabaseList />
      <BattleResults />
    </div>
  );
}
