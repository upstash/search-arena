import { BattleQuery, BattleResult } from "@/api/trpc";
import { motion } from "motion/react";
import { useRef, useCallback, useEffect } from "react";
import { QueryItem } from "./query-item";
import { SortOptions, QueryListSortSelect } from "./query-list-sort-select";

export const QueryList = ({
  sortedQueries,
  battle,
  sortBy,
  setSortBy,
  selectedQueryIndex,
  setSelectedQueryIndex,
}: {
  sortedQueries: BattleQuery[];
  battle: BattleResult;
  sortBy: SortOptions;
  setSortBy: (value: SortOptions) => void;
  selectedQueryIndex: number;
  setSelectedQueryIndex: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const queriesContainerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation - defined after sortedResults to avoid initialization error
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only handle up and down arrow keys
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        // Prevent default scrolling behavior
        e.preventDefault();

        if (e.key === "ArrowUp" && selectedQueryIndex > 0) {
          setSelectedQueryIndex((prevIndex) => prevIndex - 1);
        } else if (
          e.key === "ArrowDown" &&
          selectedQueryIndex < sortedQueries.length - 1
        ) {
          setSelectedQueryIndex((prevIndex) => prevIndex + 1);
        }
      }
    },
    [selectedQueryIndex, sortedQueries.length, setSelectedQueryIndex],
  );

  // Add event listener for keyboard navigation
  useEffect(() => {
    // Add the event listener to the document
    document.addEventListener("keydown", handleKeyDown);

    // Clean up the event listener on unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Scroll the selected query into view when it changes
  useEffect(() => {
    if (queriesContainerRef.current) {
      const selectedElement = queriesContainerRef.current.children[
        selectedQueryIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedQueryIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="w-full md:w-64 flex-shrink-0 overflow-y-auto border rounded bg-white"
    >
      {/* Header */}
      <QueryListSortSelect
        sortBy={sortBy}
        setSortBy={setSortBy}
        battle={battle}
      />

      {/* Query List */}
      <div className="divide-y" ref={queriesContainerRef} tabIndex={0}>
        {sortedQueries.map((queryResult, index) => (
          <QueryItem
            key={index}
            queryResult={queryResult}
            battle={battle as BattleResult}
            index={index}
            isSelected={index === selectedQueryIndex}
            onSelect={setSelectedQueryIndex}
          />
        ))}
      </div>
    </motion.div>
  );
};
