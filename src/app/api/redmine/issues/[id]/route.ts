import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { redmineFetch } from "@/lib/redmine/client";
import { toErrorResponse } from "@/lib/redmine/route-helpers";
import {
  IssueShowResponseSchema,
  IssueUpdatableFieldsSchema,
} from "@/lib/redmine/schemas";

export const dynamic = "force-dynamic";

const EmptyResponseSchema = z.unknown().transform(() => ({}));

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(raw: string): number {
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(`Invalid issue id: ${raw}`);
  }
  return id;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const issueId = parseId(id);
    const data = await redmineFetch(
      `/issues/${issueId}.json`,
      IssueShowResponseSchema,
    );
    return NextResponse.json(data);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const issueId = parseId(id);
    const raw: unknown = await req.json();
    const fields = IssueUpdatableFieldsSchema.parse(raw);

    await redmineFetch(
      `/issues/${issueId}.json`,
      EmptyResponseSchema,
      {
        method: "PUT",
        body: { issue: fields },
      },
    );

    const refreshed = await redmineFetch(
      `/issues/${issueId}.json`,
      IssueShowResponseSchema,
    );
    return NextResponse.json(refreshed);
  } catch (err) {
    return toErrorResponse(err);
  }
}
