"use client";

import { useParams } from "next/navigation";
import { BattleDetails } from "@/components/details";

export default function BattlePage() {
  const { battleId } = useParams();

  return <BattleDetails battleId={battleId as string} />;
}
