"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIssues } from "@/hooks/use-issues";
import { useMeta } from "@/hooks/use-meta";
import {
  useDirtyIssues,
  type DirtyFieldKey,
  type DirtyValue,
} from "@/hooks/use-dirty-issues";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useUpdateIssues } from "@/hooks/use-update-issues";
import type { MetaResponse, RedmineIssue } from "@/lib/redmine/schemas";
import { IssueTable } from "./issue-table";

const SUCCESS_FLASH_MS = 600;

export function IssuesView() {
  const meta = useMeta();
  const issues = useIssues();

  if (meta.isPending || issues.isPending) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        이슈를 불러오는 중…
      </div>
    );
  }

  if (meta.isError) {
    return (
      <ErrorPanel
        title="메타데이터를 불러오지 못했습니다"
        message={meta.error instanceof Error ? meta.error.message : String(meta.error)}
        onRetry={() => meta.refetch()}
      />
    );
  }

  if (issues.isError) {
    return (
      <ErrorPanel
        title="이슈 목록을 불러오지 못했습니다"
        message={issues.error instanceof Error ? issues.error.message : String(issues.error)}
        onRetry={() => issues.refetch()}
      />
    );
  }

  return (
    <IssuesEditor
      issues={issues.data.issues}
      meta={meta.data}
      isRefetching={issues.isFetching}
    />
  );
}

type EditorProps = {
  issues: RedmineIssue[];
  meta: MetaResponse;
  isRefetching: boolean;
};

function IssuesEditor({ issues, meta, isRefetching }: EditorProps) {
  const issuesById = useMemo(
    () => new Map(issues.map((i) => [i.id, i] as const)),
    [issues],
  );

  const { dirty, setField, resetIssue, resetAll, removeIssues } =
    useDirtyIssues(issuesById);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [errorMessages, setErrorMessages] = useState<Map<number, string[]>>(
    () => new Map(),
  );
  const [successIds, setSuccessIds] = useState<Set<number>>(() => new Set());
  const flashTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timers = flashTimers.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);

  const filteredIssues = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return issues;
    return issues.filter(
      (i) =>
        i.subject.toLowerCase().includes(q) || String(i.id).includes(q),
    );
  }, [issues, search]);

  useEffect(() => {
    if (focusedId !== null && !filteredIssues.some((i) => i.id === focusedId)) {
      setFocusedId(filteredIssues[0]?.id ?? null);
    }
  }, [filteredIssues, focusedId]);

  const assigneeOptions = useMemo(
    () => buildAssigneeOptions(issues, meta),
    [issues, meta],
  );

  const handleFieldChange = useCallback(
    (id: number, field: DirtyFieldKey, value: DirtyValue) => {
      setField(id, field, value);
      setErrorMessages((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    },
    [setField],
  );

  const flashSuccess = useCallback((ids: number[]) => {
    if (ids.length === 0) return;
    setSuccessIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    for (const id of ids) {
      const existing = flashTimers.current.get(id);
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
        setSuccessIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        flashTimers.current.delete(id);
      }, SUCCESS_FLASH_MS);
      flashTimers.current.set(id, t);
    }
  }, []);

  const update = useUpdateIssues();

  const handleFlush = useCallback(() => {
    if (dirty.size === 0 || update.isPending) return;
    const snapshot = new Map(dirty);
    update.mutate(snapshot, {
      onSuccess: (result) => {
        if (result.succeeded.length > 0) {
          removeIssues(result.succeeded);
          flashSuccess(result.succeeded);
        }
        if (result.failed.length > 0) {
          setErrorMessages((prev) => {
            const next = new Map(prev);
            for (const f of result.failed) next.set(f.id, f.errors);
            return next;
          });
        }
        announce(result);
      },
    });
  }, [dirty, update, removeIssues, flashSuccess]);

  const handleResetAll = useCallback(() => {
    resetAll();
    setErrorMessages(new Map());
  }, [resetAll]);

  const moveFocus = useCallback(
    (delta: 1 | -1) => {
      if (filteredIssues.length === 0) return;
      const idx =
        focusedId === null
          ? -1
          : filteredIssues.findIndex((i) => i.id === focusedId);
      let nextIdx: number;
      if (idx === -1) {
        nextIdx = delta === 1 ? 0 : filteredIssues.length - 1;
      } else {
        nextIdx = Math.min(
          Math.max(idx + delta, 0),
          filteredIssues.length - 1,
        );
      }
      const next = filteredIssues[nextIdx];
      if (next) setFocusedId(next.id);
    },
    [filteredIssues, focusedId],
  );

  const handleResetRow = useCallback(() => {
    if (focusedId === null) return;
    if (!dirty.has(focusedId)) return;
    resetIssue(focusedId);
    setErrorMessages((prev) => {
      if (!prev.has(focusedId)) return prev;
      const next = new Map(prev);
      next.delete(focusedId);
      return next;
    });
  }, [focusedId, dirty, resetIssue]);

  useKeyboardShortcuts({
    onNext: () => moveFocus(1),
    onPrev: () => moveFocus(-1),
    onResetRow: handleResetRow,
    onFlush: handleFlush,
    onFocusSearch: () => searchInputRef.current?.focus(),
  });

  const dirtyCount = dirty.size;

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-6 mb-4 flex flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-3">
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="제목/ID 검색 (/)"
            className="h-8 w-[260px]"
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">변경됨</span>
            <Badge variant={dirtyCount > 0 ? "default" : "secondary"}>
              {dirtyCount}건
            </Badge>
            {update.isPending && (
              <span className="text-xs text-muted-foreground">반영 중…</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShortcutHints />
          <Button
            variant="outline"
            size="sm"
            disabled={dirtyCount === 0 || update.isPending}
            onClick={handleResetAll}
          >
            되돌리기
          </Button>
          <Button
            size="sm"
            disabled={dirtyCount === 0 || update.isPending}
            onClick={handleFlush}
          >
            반영
          </Button>
        </div>
      </div>
      <IssueTable
        issues={filteredIssues}
        meta={meta}
        dirty={dirty}
        assigneeOptions={assigneeOptions}
        focusedId={focusedId}
        errorMessages={errorMessages}
        successIds={successIds}
        onFieldChange={handleFieldChange}
        onFocusRow={setFocusedId}
        isRefetching={isRefetching}
      />
    </div>
  );
}

function ShortcutHints() {
  return (
    <div className="hidden items-center gap-2 text-[11px] text-muted-foreground md:flex">
      <Kbd>j</Kbd>/<Kbd>k</Kbd>
      <span>이동</span>
      <Kbd>r</Kbd>
      <span>되돌리기</span>
      <Kbd>⌘/Ctrl + Enter</Kbd>
      <span>반영</span>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
      {children}
    </kbd>
  );
}

function announce(result: { succeeded: number[]; failed: { id: number; errors: string[] }[] }) {
  const ok = result.succeeded.length;
  const ng = result.failed.length;
  if (ok > 0 && ng === 0) {
    toast.success(`${ok}건 반영 완료`);
  } else if (ok === 0 && ng > 0) {
    toast.error(`${ng}건 실패`, {
      description: result.failed
        .slice(0, 3)
        .map((f) => `#${f.id}: ${f.errors.join("; ")}`)
        .join("\n"),
    });
  } else if (ok > 0 && ng > 0) {
    toast.warning(`성공 ${ok} / 실패 ${ng}`, {
      description: result.failed
        .slice(0, 3)
        .map((f) => `#${f.id}: ${f.errors.join("; ")}`)
        .join("\n"),
    });
  }
}

function buildAssigneeOptions(
  issues: RedmineIssue[],
  meta: MetaResponse,
): Array<{ id: number | null; name: string }> {
  const seen = new Map<number, string>();
  seen.set(meta.currentUser.id, `${meta.currentUser.name} (나)`);
  for (const issue of issues) {
    if (issue.assigned_to && !seen.has(issue.assigned_to.id)) {
      seen.set(issue.assigned_to.id, issue.assigned_to.name);
    }
  }
  const list: Array<{ id: number | null; name: string }> = [
    { id: null, name: "(미지정)" },
  ];
  for (const [id, name] of seen) {
    list.push({ id, name });
  }
  return list;
}

function ErrorPanel({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm">
      <p className="font-medium text-destructive">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-destructive/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex h-8 items-center rounded-md border border-destructive/40 px-3 text-xs font-medium text-destructive hover:bg-destructive/10"
      >
        다시 시도
      </button>
    </div>
  );
}
