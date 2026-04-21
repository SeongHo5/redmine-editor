"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  effectiveValue,
  originalValue,
  type DirtyFieldKey,
  type DirtyFields,
  type DirtyMap,
  type DirtyValue,
} from "@/hooks/use-dirty-issues";
import type { MetaResponse, RedmineIssue } from "@/lib/redmine/schemas";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime, issueUrl } from "./format";
import { InlineSelect } from "./inline-select";

type Props = {
  issues: RedmineIssue[];
  meta: MetaResponse;
  dirty: DirtyMap;
  assigneeOptions: Array<{ id: number | null; name: string }>;
  focusedId: number | null;
  errorMessages?: Map<number, string[]>;
  successIds?: Set<number>;
  onFieldChange: (
    issueId: number,
    field: DirtyFieldKey,
    value: DirtyValue,
  ) => void;
  onFocusRow?: (issueId: number) => void;
  isRefetching?: boolean;
};

export function IssueTable({
  issues,
  meta,
  dirty,
  assigneeOptions,
  focusedId,
  errorMessages,
  successIds,
  onFieldChange,
  onFocusRow,
  isRefetching,
}: Props) {
  if (issues.length === 0) {
    return (
      <div className="rounded-md border p-10 text-center text-sm text-muted-foreground">
        할당된 열린 이슈가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          총 <span className="font-medium text-foreground">{issues.length}</span>건
          {isRefetching ? " · 갱신 중…" : ""}
        </span>
        <span>
          메타: 상태 {meta.statuses.length} · 트래커 {meta.trackers.length} · 우선순위 {meta.priorities.length}
        </span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">#ID</TableHead>
              <TableHead className="min-w-[320px]">제목</TableHead>
              <TableHead>프로젝트</TableHead>
              <TableHead>트래커</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>우선순위</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>마감일</TableHead>
              <TableHead>수정일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                meta={meta}
                dirty={dirty.get(issue.id)}
                assigneeOptions={assigneeOptions}
                focused={focusedId === issue.id}
                errors={errorMessages?.get(issue.id)}
                successFlash={successIds?.has(issue.id) ?? false}
                onFieldChange={onFieldChange}
                onFocusRow={onFocusRow}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type RowProps = {
  issue: RedmineIssue;
  meta: MetaResponse;
  dirty: DirtyFields | undefined;
  assigneeOptions: Array<{ id: number | null; name: string }>;
  focused: boolean;
  errors: string[] | undefined;
  successFlash: boolean;
  onFieldChange: (
    issueId: number,
    field: DirtyFieldKey,
    value: DirtyValue,
  ) => void;
  onFocusRow?: (issueId: number) => void;
};

function IssueRow({
  issue,
  meta,
  dirty,
  assigneeOptions,
  focused,
  errors,
  successFlash,
  onFieldChange,
  onFocusRow,
}: RowProps) {
  const statusValue = effectiveValue(issue, dirty, "status_id");
  const priorityValue = effectiveValue(issue, dirty, "priority_id");
  const assignedValue = effectiveValue(issue, dirty, "assigned_to_id");

  const isStatusDirty =
    dirty?.status_id !== undefined &&
    dirty.status_id !== originalValue(issue, "status_id");
  const isPriorityDirty =
    dirty?.priority_id !== undefined &&
    dirty.priority_id !== originalValue(issue, "priority_id");
  const isAssigneeDirty =
    dirty?.assigned_to_id !== undefined &&
    dirty.assigned_to_id !== originalValue(issue, "assigned_to_id");

  const rowErrorTitle = errors?.join("\n");

  return (
    <TableRow
      data-issue-id={issue.id}
      onMouseEnter={() => onFocusRow?.(issue.id)}
      className={cn(
        focused && "bg-muted/40",
        errors && "outline outline-2 -outline-offset-2 outline-destructive",
        successFlash &&
          "bg-emerald-50 transition-colors dark:bg-emerald-950/40",
      )}
    >
      <TableCell className="font-mono text-xs">
        <a
          href={issueUrl(meta.redmineBaseUrl, issue.id)}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
          title={rowErrorTitle}
        >
          #{issue.id}
        </a>
      </TableCell>
      <TableCell className="max-w-[480px] truncate" title={issue.subject}>
        {issue.subject}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {issue.project.name}
      </TableCell>
      <TableCell>{issue.tracker.name}</TableCell>
      <TableCell>
        <InlineSelect
          ariaLabel={`상태 #${issue.id}`}
          value={(statusValue as number | null) ?? null}
          isDirty={isStatusDirty}
          options={meta.statuses.map((s) => ({
            id: s.id,
            name: s.is_closed ? `${s.name} (종료)` : s.name,
          }))}
          onChange={(v) => onFieldChange(issue.id, "status_id", v)}
        />
      </TableCell>
      <TableCell>
        <InlineSelect
          ariaLabel={`우선순위 #${issue.id}`}
          value={(priorityValue as number | null) ?? null}
          isDirty={isPriorityDirty}
          options={meta.priorities.map((p) => ({ id: p.id, name: p.name }))}
          onChange={(v) => onFieldChange(issue.id, "priority_id", v)}
        />
      </TableCell>
      <TableCell>
        <InlineSelect
          ariaLabel={`담당자 #${issue.id}`}
          value={assignedValue as number | null}
          isDirty={isAssigneeDirty}
          options={assigneeOptions}
          onChange={(v) => onFieldChange(issue.id, "assigned_to_id", v)}
        />
      </TableCell>
      <TableCell className="font-mono text-xs">
        {formatDate(issue.due_date)}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {formatDateTime(issue.updated_on)}
      </TableCell>
    </TableRow>
  );
}

