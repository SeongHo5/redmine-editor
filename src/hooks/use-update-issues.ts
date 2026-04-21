"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { IssueShowResponseSchema } from "@/lib/redmine/schemas";
import type { DirtyFields, DirtyMap } from "./use-dirty-issues";

export type FlushFailure = { id: number; errors: string[] };

export type FlushResult = {
  succeeded: number[];
  failed: FlushFailure[];
};

function toErrors(reason: unknown): string[] {
  if (reason instanceof ApiError) return reason.errors;
  if (reason instanceof Error) return [reason.message];
  return [String(reason)];
}

export function useUpdateIssues() {
  const queryClient = useQueryClient();
  return useMutation<FlushResult, never, DirtyMap>({
    mutationFn: async (dirty) => {
      const entries: Array<[number, DirtyFields]> = Array.from(dirty.entries());
      const settled = await Promise.allSettled(
        entries.map(([id, fields]) =>
          apiFetch(`/api/redmine/issues/${id}`, IssueShowResponseSchema, {
            method: "PUT",
            body: fields,
          }),
        ),
      );

      const succeeded: number[] = [];
      const failed: FlushFailure[] = [];
      settled.forEach((res, idx) => {
        const id = entries[idx][0];
        if (res.status === "fulfilled") {
          succeeded.push(id);
        } else {
          failed.push({ id, errors: toErrors(res.reason) });
        }
      });
      return { succeeded, failed };
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
    },
  });
}
