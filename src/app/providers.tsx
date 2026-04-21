"use client";

import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

const PERSIST_BUSTER = "redmine-editor:v1";
const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const noopStorage: Pick<Storage, "getItem" | "setItem" | "removeItem"> = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage:
        typeof window !== "undefined" ? window.localStorage : noopStorage,
      key: "redmine-editor:query-cache",
      throttleTime: 1000,
    }),
  );

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE_MS,
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Only persist the slow-changing meta query. Issues list stays
            // in-memory and refetches on every session.
            const [root] = query.queryKey;
            return (
              query.state.status === "success" && root === "meta"
            );
          },
        },
      }}
    >
      {children}
      <Toaster richColors closeButton position="top-right" />
    </PersistQueryClientProvider>
  );
}
