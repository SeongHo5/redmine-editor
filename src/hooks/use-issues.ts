"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  IssuesListResponseSchema,
  type IssuesListResponse,
} from "@/lib/redmine/schemas";

export type IssuesQueryParams = {
  assigned_to_id?: string;
  status_id?: string;
  project_id?: string | number;
  limit?: number;
  include?: string;
};

export function useIssues(params: IssuesQueryParams = {}) {
  return useQuery<IssuesListResponse>({
    queryKey: queryKeys.issues.list(params),
    queryFn: ({ signal }) =>
      apiFetch("/api/redmine/issues", IssuesListResponseSchema, {
        signal,
        searchParams: params,
      }),
    staleTime: 30 * 1000,
  });
}
