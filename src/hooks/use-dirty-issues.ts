"use client";

import { useCallback, useState } from "react";
import type { RedmineIssue } from "@/lib/redmine/schemas";

export type DirtyFieldKey = "status_id" | "priority_id" | "assigned_to_id";

export type DirtyFields = {
  status_id?: number;
  priority_id?: number;
  assigned_to_id?: number | null;
};

export type DirtyMap = Map<number, DirtyFields>;

export type DirtyValue = number | null | undefined;

export function originalValue(
  issue: RedmineIssue,
  field: DirtyFieldKey,
): DirtyValue {
  switch (field) {
    case "status_id":
      return issue.status.id;
    case "priority_id":
      return issue.priority.id;
    case "assigned_to_id":
      return issue.assigned_to?.id ?? null;
  }
}

export function effectiveValue(
  issue: RedmineIssue,
  dirty: DirtyFields | undefined,
  field: DirtyFieldKey,
): DirtyValue {
  if (dirty && field in dirty) {
    return dirty[field];
  }
  return originalValue(issue, field);
}

export function useDirtyIssues(issuesById: Map<number, RedmineIssue>) {
  const [dirty, setDirty] = useState<DirtyMap>(() => new Map());

  const setField = useCallback(
    (issueId: number, field: DirtyFieldKey, value: DirtyValue) => {
      setDirty((prev) => {
        const issue = issuesById.get(issueId);
        if (!issue) return prev;
        const orig = originalValue(issue, field);
        const current = prev.get(issueId);
        const next: DirtyFields = { ...current };

        if (value === undefined || value === orig) {
          delete next[field];
        } else {
          if (field === "assigned_to_id") {
            next.assigned_to_id = value;
          } else if (typeof value === "number") {
            next[field] = value;
          }
        }

        const nextMap: DirtyMap = new Map(prev);
        if (Object.keys(next).length === 0) {
          nextMap.delete(issueId);
        } else {
          nextMap.set(issueId, next);
        }
        return nextMap;
      });
    },
    [issuesById],
  );

  const resetIssue = useCallback((issueId: number) => {
    setDirty((prev) => {
      if (!prev.has(issueId)) return prev;
      const next = new Map(prev);
      next.delete(issueId);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setDirty((prev) => (prev.size === 0 ? prev : new Map()));
  }, []);

  const removeIssues = useCallback((ids: number[]) => {
    setDirty((prev) => {
      if (ids.length === 0) return prev;
      let changed = false;
      const next = new Map(prev);
      for (const id of ids) {
        if (next.delete(id)) changed = true;
      }
      return changed ? next : prev;
    });
  }, []);

  return {
    dirty,
    setField,
    resetIssue,
    resetAll,
    removeIssues,
  };
}
