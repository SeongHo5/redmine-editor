"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MetaResponse, RedmineIssue } from "@/lib/redmine/schemas";
import { formatDate, formatDateTime, issueUrl } from "./format";

type Props = {
  issues: RedmineIssue[];
  meta: MetaResponse;
  isRefetching?: boolean;
};

export function IssueTable({ issues, meta, isRefetching }: Props) {
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
              <TableRow key={issue.id}>
                <TableCell className="font-mono text-xs">
                  <a
                    href={issueUrl(meta.redmineBaseUrl, issue.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
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
                  <Badge variant={issue.status.is_closed ? "secondary" : "outline"}>
                    {issue.status.name}
                  </Badge>
                </TableCell>
                <TableCell>{issue.priority.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {issue.assigned_to?.name ?? "-"}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {formatDate(issue.due_date)}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatDateTime(issue.updated_on)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
