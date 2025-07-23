import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { AppRouter } from ".";

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

export type Database = RouterOutput["database"]["getAll"][number];
export type NewDatabase = RouterInput["database"]["create"];

export type NewBattle = RouterInput["battle"]["create"];
export type BattleResult = RouterOutput["battle"]["getAll"][number];
