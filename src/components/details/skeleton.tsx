import { motion } from "motion/react";

export function BattleDetailsSkeleton() {
  return (
    <div className="space-y-6 view-transition-battle-details">
      {/* Battle Header Skeleton */}
      <div className="space-y-2">
        {/* Battle Title Skeleton */}
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>

        {/* Battle Header with Scores Skeleton */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Database 1 */}
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-5 bg-blue-200 rounded w-16 animate-pulse"></div>
            <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Score 1 */}
          <div className="h-8 bg-blue-200 rounded w-12 animate-pulse"></div>

          {/* VS */}
          <div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div>

          {/* Score 2 */}
          <div className="h-8 bg-green-200 rounded w-12 animate-pulse"></div>

          {/* Database 2 */}
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-5 bg-green-200 rounded w-16 animate-pulse"></div>
            <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Demo Checkbox */}
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Query List Sidebar Skeleton */}
        <motion.div
          className="w-full md:w-64 flex-shrink-0 overflow-y-auto border rounded bg-white view-transition-query-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          {/* Header Skeleton */}
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-7 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Query Items Skeleton */}
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, index) => (
              <motion.div
                key={index}
                className="p-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Query text skeleton */}
                <div className="h-3 bg-gray-200 rounded mb-1 animate-pulse w-full"></div>

                {/* Scores skeleton */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex space-x-2">
                    <div className="h-3 bg-blue-200 rounded w-8 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-4 animate-pulse"></div>
                    <div className="h-3 bg-green-200 rounded w-8 animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
                    <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Query Details Main Content Skeleton */}
        <motion.div
          className="flex-grow overflow-y-auto border rounded bg-white view-transition-query-details"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          {/* Header Skeleton */}
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex justify-between grow">
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-5 bg-purple-200 rounded w-16 animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="p-3">
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.2 }}
            >
              {/* Database Results Skeleton - Left Column */}
              <div>
                {/* Database Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="flex gap-1">
                    <div className="h-5 bg-blue-200 rounded w-16 animate-pulse"></div>
                    <div className="h-5 bg-amber-200 rounded w-20 animate-pulse"></div>
                  </div>
                </div>

                {/* LLM Feedback Skeleton */}
                <div className="h-[100px] bg-gray-100 rounded mb-2 animate-pulse"></div>

                {/* Search Results Skeleton */}
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <motion.div
                      key={index}
                      className="border rounded p-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.5 + index * 0.05,
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-100 rounded w-full animate-pulse"></div>
                        <div className="h-2 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Database Results Skeleton - Right Column */}
              <div>
                {/* Database Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="flex gap-1">
                    <div className="h-5 bg-green-200 rounded w-16 animate-pulse"></div>
                    <div className="h-5 bg-amber-200 rounded w-20 animate-pulse"></div>
                  </div>
                </div>

                {/* LLM Feedback Skeleton */}
                <div className="h-[100px] bg-gray-100 rounded mb-2 animate-pulse"></div>

                {/* Search Results Skeleton */}
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <motion.div
                      key={index}
                      className="border rounded p-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.5 + index * 0.05,
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-100 rounded w-full animate-pulse"></div>
                        <div className="h-2 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
