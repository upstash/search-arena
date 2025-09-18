import { SearchResult, SearchMetadata } from "@/api/providers/types";
import { BattleQuery, BattleResult } from "@/api/trpc";
import { PROVIDERS } from "@/lib/providers";
import { Checkbox } from "../ui/checkbox";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

export function QueryDetails({
  selectedQuery,
  battle,
}: {
  selectedQuery: BattleQuery;
  battle: BattleResult;
}) {
  const [hideDescriptions, setHideDescriptions] = useState(false);

  const database =
    selectedQuery.results.at(0)?.databaseId === battle.databaseId1
      ? battle.database1
      : battle.database2;

  return (
    <motion.div
      className="flex-grow overflow-y-auto border rounded bg-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.2 }}
    >
      <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center justify-between gap-2">
          <motion.h2
            className="text-sm font-medium flex justify-between grow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Results: &quot;{selectedQuery.queryText}&quot;
            {selectedQuery.results.at(0)?.llmDuration &&
            Number(selectedQuery.results.at(0)?.llmDuration) > 0 ? (
              <Badge className="bg-purple-100 text-purple-800 text-xs">
                LLM:{" "}
                {(
                  Number(selectedQuery.results.at(0)?.llmDuration) / 1000
                ).toFixed(1)}
                s
              </Badge>
            ) : (
              selectedQuery.results.at(0)?.score === "-1" && (
                <Badge className="bg-gray-100 text-gray-600 text-xs">
                  LLM: Disabled
                </Badge>
              )
            )}
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
          {selectedQuery.results
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
          "text-gray-600 mb-1 break-words",
          expanded ? "line-clamp-none" : "line-clamp-3"
        )}
      >
        {result.description}
      </motion.p>
    </motion.div>
  );
};

const SearchMetadataDisplay = ({ metadata }: { metadata: SearchMetadata }) => {
  // Filter out processing time and total results, only show meaningful metadata
  const filteredMetadata = Object.entries(metadata).filter(
    ([key]) => key !== "totalResults" && key !== "processingTime"
  );

  if (filteredMetadata.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 text-xs w-full">
      <div className="font-medium text-gray-700 mb-1">Search Metadata:</div>
      {filteredMetadata.map(([key, value]) => (
        <div key={key} className="text-gray-600 text-wrap break-words">
          <span className="font-semibold">{key}:</span>{" "}
          {typeof value === "string"
            ? value.replaceAll("+", " ")
            : JSON.stringify(value)}
        </div>
      ))}
    </div>
  );
};
