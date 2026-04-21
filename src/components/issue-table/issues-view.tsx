"use client";

import { useIssues } from "@/hooks/use-issues";
import { useMeta } from "@/hooks/use-meta";
import { IssueTable } from "./issue-table";

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
    <IssueTable
      issues={issues.data.issues}
      meta={meta.data}
      isRefetching={issues.isFetching}
    />
  );
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
