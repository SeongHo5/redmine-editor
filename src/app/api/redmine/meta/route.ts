import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { redmineFetch } from "@/lib/redmine/client";
import { toErrorResponse } from "@/lib/redmine/route-helpers";
import {
  CurrentUserResponseSchema,
  MetaResponseSchema,
  PrioritiesResponseSchema,
  StatusesResponseSchema,
  TrackersResponseSchema,
  type MetaResponse,
} from "@/lib/redmine/schemas";

// Keep the handler dynamic so Next.js never tries to prerender it at build
// time (which would fail without Redmine network access). Caching happens at
// two other layers: per-fetch Data Cache for the Redmine calls below, and a
// Cache-Control header on the response for the browser.
export const dynamic = "force-dynamic";

const META_REVALIDATE_SECONDS = 60 * 60;

export async function GET() {
  try {
    const [statuses, trackers, priorities, currentUser] = await Promise.all([
      redmineFetch("/issue_statuses.json", StatusesResponseSchema, {
        revalidate: META_REVALIDATE_SECONDS,
        tags: ["redmine:statuses"],
      }),
      redmineFetch("/trackers.json", TrackersResponseSchema, {
        revalidate: META_REVALIDATE_SECONDS,
        tags: ["redmine:trackers"],
      }),
      redmineFetch(
        "/enumerations/issue_priorities.json",
        PrioritiesResponseSchema,
        {
          revalidate: META_REVALIDATE_SECONDS,
          tags: ["redmine:priorities"],
        },
      ),
      redmineFetch("/users/current.json", CurrentUserResponseSchema, {
        revalidate: META_REVALIDATE_SECONDS,
        tags: ["redmine:current-user"],
      }),
    ]);

    const user = currentUser.user;
    const fullName = [user.firstname, user.lastname]
      .filter(Boolean)
      .join(" ")
      .trim();
    const displayName =
      user.name ?? (fullName || user.login || `User #${user.id}`);

    const body: MetaResponse = MetaResponseSchema.parse({
      statuses: statuses.issue_statuses,
      trackers: trackers.trackers,
      priorities: priorities.issue_priorities,
      currentUser: { id: user.id, name: displayName },
      redmineBaseUrl: env.REDMINE_BASE_URL,
    });
    return NextResponse.json(body, {
      headers: {
        "Cache-Control":
          "private, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
