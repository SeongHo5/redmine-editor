"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { MetaResponseSchema, type MetaResponse } from "@/lib/redmine/schemas";

export function useMeta() {
  return useQuery<MetaResponse>({
    queryKey: queryKeys.meta.root(),
    queryFn: ({ signal }) =>
      apiFetch("/api/redmine/meta", MetaResponseSchema, { signal }),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
