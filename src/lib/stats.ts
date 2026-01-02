
import { BattleQuery } from "@/api/trpc";

export function calculateStats(values: number[]) {
  if (values.length === 0) return { mean: 0, stdDev: 0, count: 0 };

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  return { mean, stdDev, count: values.length };
}

export function getDatabaseStats(query: BattleQuery, databaseId: string, configIndex: number) {
  const filteredResults = query.results.filter(r => r.databaseId === databaseId && r.configIndex === configIndex);

  // Deduplicate by ratingIndex
  const uniqueResults = new Map<number, typeof filteredResults[0]>();
  for (const r of filteredResults) {
    const idx = r.ratingIndex || 1;
    if (!uniqueResults.has(idx)) {
      uniqueResults.set(idx, r);
    }
  }

  const scores = Array.from(uniqueResults.values())
    .map(r => r.score ? Number(r.score) : -1)
    .filter(s => s !== -1);

  console.log("ALL RESULTS", {
    db1Results:
      query.results.filter(r => r.configIndex === 1).map(r => r.score),
    db2Results:
      query.results.filter(r => r.configIndex === 2).map(r => r.score),
    uniqueResults,
    scores,
    databaseId,
    configIndex,
    result: calculateStats(scores)
  })

  return calculateStats(scores);
}
