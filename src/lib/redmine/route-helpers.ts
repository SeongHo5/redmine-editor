import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RedmineApiError } from "./client";

export type ApiErrorBody = { errors: string[] };

export function toErrorResponse(err: unknown): NextResponse<ApiErrorBody> {
  if (err instanceof RedmineApiError) {
    return NextResponse.json<ApiErrorBody>(
      { errors: err.errors },
      { status: err.status },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json<ApiErrorBody>(
      {
        errors: err.issues.map(
          (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
        ),
      },
      { status: 502 },
    );
  }
  console.error("Unhandled API error", err);
  const message = err instanceof Error ? err.message : "Unknown error";
  return NextResponse.json<ApiErrorBody>(
    { errors: [message] },
    { status: 500 },
  );
}
