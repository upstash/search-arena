import { SearchResult, SearchMetadata } from "@/api/providers/types";
import { BattleQuery, BattleResult } from "@/api/trpc";
import { PROVIDERS } from "@/lib/providers";
import { Checkbox } from "../ui/checkbox";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDatabaseStats } from "@/lib/stats";
import { SimpleTooltip } from "../ui/simple-tooltip";

export function QueryDetails({
  selectedQuery,
  battle,
}: {
  selectedQuery: BattleQuery;
  battle: BattleResult;
}) {
  const [hideDescriptions, setHideDescriptions] = useState(false);
  const [selectedRatingIndex, setSelectedRatingIndex] = useState(1);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedRatingIndex(1);
  }, [selectedQuery.id]);

  const database =
    selectedQuery.results.at(0)?.databaseId === battle.databaseId1
      ? battle.database1
      : battle.database2;

  console.log("SelectedQuery", selectedQuery);

  // Calculate stats
  const db1Stats = getDatabaseStats(selectedQuery, battle.databaseId1, 1);
  const db2Stats = getDatabaseStats(selectedQuery, battle.databaseId2, 2);

  // Get available rating indices
  const ratingIndices = Array.from(
    new Set(selectedQuery.results.map((r) => r.ratingIndex || 1)),
  ).sort((a, b) => a - b);

  const hasMultipleRatings = ratingIndices.length > 1;

  // Filter results for display
  const displayedResults = selectedQuery.results.filter(
    (r) => (r.ratingIndex || 1) === selectedRatingIndex,
  );

  return (
    <motion.div
      className="grow overflow-y-auto border rounded bg-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.2 }}
    >
      <div className="p-3 border-b bg-gray-50 space-y-3">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2">
          <motion.h2
            className="text-sm font-medium flex justify-between grow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Results: &quot;{selectedQuery.queryText}&quot;
            <LlmUsageBadge result={displayedResults.at(0)} />
          </motion.h2>
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Checkbox
              id="hide-descriptions"
              checked={hideDescriptions}
              onClick={() => setHideDescriptions(!hideDescriptions)}
              className="h-5 w-5 cursor-pointer"
            />
            <label
              htmlFor="hide-descriptions"
              className="text-xs text-gray-600 cursor-pointer"
            >
              Hide descriptions
            </label>
          </motion.div>
        </div>

        {/* Rating Selector & Stats - Only show if multiple ratings */}
        {hasMultipleRatings && (
          <div className="flex flex-col gap-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">
                Rating Attempt:
              </span>
              <Select
                value={String(selectedRatingIndex)}
                onValueChange={(val) => setSelectedRatingIndex(Number(val))}
              >
                <SelectTrigger className="h-8 w-[240px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ratingIndices.map((idx) => {
                    // Find scores for this index
                    const r1 = selectedQuery.results.filter(
                      (res) =>
                        res.ratingIndex === idx &&
                        res.databaseId === battle.databaseId1 &&
                        res.configIndex === 1,
                    );
                    const r2 = selectedQuery.results.filter(
                      (res) =>
                        res.ratingIndex === idx &&
                        res.databaseId === battle.databaseId2 &&
                        res.configIndex === 2,
                    );

                    if (r1.length > 1 || r2.length > 1) {
                      throw new Error(
                        "Multiple results for rating index " +
                          idx +
                          " " +
                          JSON.stringify(selectedQuery.results),
                      );
                    }

                    return (
                      <SelectItem
                        key={idx}
                        value={String(idx)}
                        className="text-xs"
                      >
                        Rating #{idx} {"("}
                        <span className="text-blue-600">
                          {r1.at(0)?.score}
                        </span>{" "}
                        vs{" "}
                        <span className="text-green-600">
                          {r2.at(0)?.score}
                        </span>
                        {")"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2 rounded border">
              <div>
                <div className="font-semibold text-gray-700 mb-1">
                  {battle.database1.label} (Aggregate)
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-gray-600">
                  <span>
                    Mean:{" "}
                    <span className="font-mono text-blue-600">
                      {db1Stats.mean.toFixed(2)}
                    </span>
                  </span>
                  <span>
                    StdDev:{" "}
                    <span className="font-mono text-gray-800">
                      {db1Stats.stdDev.toFixed(2)}
                    </span>
                  </span>
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 mb-1">
                  {battle.database2.label} (Aggregate)
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-gray-600">
                  <span>
                    Mean:{" "}
                    <span className="font-mono text-green-600">
                      {db2Stats.mean.toFixed(2)}
                    </span>
                  </span>
                  <span>
                    StdDev:{" "}
                    <span className="font-mono text-gray-800">
                      {db2Stats.stdDev.toFixed(2)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedQuery.error && (
        <div className="p-3">
          <motion.div
            className="bg-red-50 border border-red-200 rounded p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {selectedQuery.error}
            </motion.p>
          </motion.div>
        </div>
      )}

      <div className="p-3">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.2 }}
        >
          {displayedResults
            .sort((a) => (a.databaseId === battle.databaseId1 ? -1 : 1))
            .map((result) => {
              const resultWithMetadata = result as typeof result & {
                metadata?: SearchMetadata;
              };
              return (
                <div key={result.id}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">
                      {result.databaseId === battle.databaseId1
                        ? battle.database1.label
                        : battle.database2.label}
                    </h3>
                    <div className="flex gap-1">
                      {result.score && Number(result.score) !== -1 && (
                        <Badge
                          className="text-xs"
                          style={{
                            backgroundColor:
                              PROVIDERS[database.provider].color["100"],
                            color: PROVIDERS[database.provider].color["800"],
                          }}
                        >
                          Score:{" "}
                          {Number(result.score) === -1 ? "-" : result.score}
                        </Badge>
                      )}
                      {result.searchDuration && (
                        <Badge className="bg-amber-100 text-amber-800 text-xs">
                          Search: {Number(result.searchDuration).toFixed(0)}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                  {result.llmFeedback && (
                    <p className="text-xs text-gray-500 my-2 h-[100px] overflow-scroll">
                      {result.llmFeedback}
                    </p>
                  )}
                  {resultWithMetadata.metadata &&
                    typeof resultWithMetadata.metadata === "object" && (
                      <SearchMetadataDisplay
                        metadata={resultWithMetadata.metadata}
                      />
                    )}
                  <div className="space-y-2">
                    <AnimatePresence>
                      {(result.results as SearchResult[]).map((item, index) => (
                        <QueryDetailCard
                          key={index}
                          result={item}
                          index={index}
                          hideDescriptions={hideDescriptions}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
        </motion.div>
      </div>
    </motion.div>
  );
}

const QueryDetailCard = ({
  result,
  index,
  hideDescriptions,
}: {
  result: SearchResult;
  index: number;
  hideDescriptions: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      key={index}
      className="border rounded p-2 text-xs cursor-pointer hover:bg-gray-50/40 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
      }}
      onClick={(e) => {
        // Dont expand if the click was just selecting the text and its a drag
        if (e.detail > 1) {
          return;
        }

        setExpanded(!expanded);
      }}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="font-medium">{result.title}</div>
        <span className="text-zinc-500">{result.score?.toFixed(2)}</span>
      </div>
      <motion.p
        initial={{
          opacity: 0,
          height: hideDescriptions ? "0" : "auto",
        }}
        animate={{
          opacity: 1,
          height: hideDescriptions ? "0" : "auto",
        }}
        transition={{ delay: index * 0.02 }}
        className={cn(
          "text-gray-600 mb-1 wrap-break-word",
          expanded ? "line-clamp-none" : "line-clamp-3",
        )}
      >
        {result.description}
      </motion.p>
    </motion.div>
  );
};

const LlmUsageBadge = ({
  result,
}: {
  result: BattleQuery["results"][0] | undefined;
}) => {
  if (!result) return <div className="flex items-center gap-2" />;

  return (
    <div className="flex items-center gap-2">
      {result.llmDuration && Number(result.llmDuration) > 0 ? (
        <SimpleTooltip
          content={(() => {
            const metadata = result.metadata as any;
            const usage = metadata?.usage;

            if (!usage) return "LLM Evaluation";

            return (
              <div className="space-y-1 text-xs">
                <div className="font-semibold border-b pb-1 mb-1">
                  LLM Usage
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-mono text-right">
                    {(Number(result.llmDuration) / 1000).toFixed(2)}s
                  </span>

                  <span className="text-gray-500">Total Cost:</span>
                  <span className="font-mono text-right">
                    ${Number(usage.totalCost).toFixed(6)}
                  </span>

                  <span className="text-gray-500">Input Cost:</span>
                  <span className="font-mono text-right">
                    ${Number(usage.inputCost).toFixed(6)}
                  </span>

                  <span className="text-gray-500">Output Cost:</span>
                  <span className="font-mono text-right">
                    ${Number(usage.outputCost).toFixed(6)}
                  </span>

                  <span className="text-gray-500">Prompt Tokens:</span>
                  <span className="font-mono text-right">
                    {usage.promptTokens}
                  </span>

                  <span className="text-gray-500">Output Tokens:</span>
                  <span className="font-mono text-right">
                    {usage.completionTokens}
                  </span>
                </div>
              </div>
            );
          })()}
        >
          <Badge className="bg-purple-100 text-purple-800 text-xs cursor-help hover:bg-purple-200 transition-colors">
            LLM: {(Number(result.llmDuration) / 1000).toFixed(1)}s
            {(() => {
              const cost = (result.metadata as any)?.usage?.totalCost;
              return cost ? ` • $${Number(cost).toFixed(6)}` : "";
            })()}
          </Badge>
        </SimpleTooltip>
      ) : (
        result.score === "-1" && (
          <Badge className="bg-gray-100 text-gray-600 text-xs">
            LLM: Disabled
          </Badge>
        )
      )}
    </div>
  );
};

const SearchMetadataDisplay = ({ metadata }: { metadata: SearchMetadata }) => {
  // Filter out processing time and total results, only show meaningful metadata
  const filteredMetadata = Object.entries(metadata).filter(
    ([key]) => !["totalResults", "processingTime", "usage"].includes(key),
  );

  if (filteredMetadata.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 text-xs w-full">
      <div className="font-medium text-gray-700 mb-1">Search Metadata:</div>
      {filteredMetadata.map(([key, value]) => (
        <div key={key} className="text-gray-600 text-wrap wrap-break-word">
          <span className="font-semibold">{key}:</span>{" "}
          {typeof value === "string"
            ? value.replaceAll("+", " ")
            : JSON.stringify(value)}
        </div>
      ))}
    </div>
  );
};
