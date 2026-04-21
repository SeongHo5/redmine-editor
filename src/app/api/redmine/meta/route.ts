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

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [statuses, trackers, priorities, currentUser] = await Promise.all([
      redmineFetch("/issue_statuses.json", StatusesResponseSchema),
      redmineFetch("/trackers.json", TrackersResponseSchema),
      redmineFetch(
        "/enumerations/issue_priorities.json",
        PrioritiesResponseSchema,
      ),
      redmineFetch("/users/current.json", CurrentUserResponseSchema),
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
    return NextResponse.json(body);
  } catch (err) {
    return toErrorResponse(err);
  }
}
