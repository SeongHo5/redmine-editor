import { NextResponse, type NextRequest } from "next/server";
import { redmineFetch } from "@/lib/redmine/client";
import { toErrorResponse } from "@/lib/redmine/route-helpers";
import { IssuesListResponseSchema } from "@/lib/redmine/schemas";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  assigned_to_id: "me",
  status_id: "open",
  limit: "100",
};

export async function GET(req: NextRequest) {
  try {
    const incoming = req.nextUrl.searchParams;
    const searchParams: Record<string, string> = { ...DEFAULTS };
    for (const [key, value] of incoming.entries()) {
      searchParams[key] = value;
    }

    const data = await redmineFetch(
      "/issues.json",
      IssuesListResponseSchema,
      { searchParams },
    );
    return NextResponse.json(data, {
      headers: {
        // Browser can reuse the response across quick refreshes while we
        // revalidate in the background; TanStack Query still drives the
        // actual freshness semantics in-app.
        "Cache-Control":
          "private, max-age=0, stale-while-revalidate=30",
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
