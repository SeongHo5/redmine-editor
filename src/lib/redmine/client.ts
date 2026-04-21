import "server-only";
import type { ZodType } from "zod";
import { env } from "@/lib/env";
import { RedmineErrorResponseSchema } from "./schemas";

export class RedmineApiError extends Error {
  readonly status: number;
  readonly errors: string[];
  readonly url: string;

  constructor(status: number, errors: string[], url: string) {
    super(
      `Redmine API error ${status}: ${errors.join("; ") || "Unknown error"}`,
    );
    this.name = "RedmineApiError";
    this.status = status;
    this.errors = errors;
    this.url = url;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
};

function buildUrl(
  path: string,
  searchParams?: RequestOptions["searchParams"],
): string {
  const url = new URL(
    path.startsWith("/") ? path : `/${path}`,
    env.REDMINE_BASE_URL,
  );
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseErrorBody(res: Response): Promise<string[]> {
  try {
    const text = await res.text();
    if (!text) return [`HTTP ${res.status} ${res.statusText}`];
    const body = JSON.parse(text);
    const parsed = RedmineErrorResponseSchema.safeParse(body);
    if (parsed.success && parsed.data.errors.length > 0) {
      return parsed.data.errors;
    }
    return [`HTTP ${res.status} ${res.statusText}`];
  } catch {
    return [`HTTP ${res.status} ${res.statusText}`];
  }
}

export async function redmineFetch<T>(
  path: string,
  schema: ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.searchParams);
  const method = options.method ?? "GET";
  const hasBody = options.body !== undefined;

  const res = await fetch(url, {
    method,
    headers: {
      "X-Redmine-API-Key": env.REDMINE_API_KEY,
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    signal: options.signal,
  });

  if (!res.ok) {
    const errors = await parseErrorBody(res);
    throw new RedmineApiError(res.status, errors, url);
  }

  if (res.status === 204) {
    return schema.parse(undefined);
  }

  const text = await res.text();
  if (!text) {
    return schema.parse(undefined);
  }

  const json: unknown = JSON.parse(text);
  return schema.parse(json);
}
