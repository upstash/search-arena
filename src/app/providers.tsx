"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "@/api/trpc/client";
import { toast } from "sonner";
import { AppRouter } from "@/api/trpc";
import { observable } from "@trpc/server/observable";

/**
 * tRPC Provider component for wrapping the application
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        toasterLink,
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

const toasterLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      return next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(err) {
          toast.error(err.message);
          observer.error(err);
        },
        complete() {
          observer.complete();
        },
      });
    });
  };
};
