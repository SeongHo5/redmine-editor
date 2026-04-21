import type { ZodType } from "zod";

export class ApiError extends Error {
  readonly status: number;
  readonly errors: string[];

  constructor(status: number, errors: string[]) {
    super(errors.join("; ") || `HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  searchParams?: Record<string, string | number | boolean | undefined>;
};

function buildPath(
  path: string,
  searchParams?: FetchOptions["searchParams"],
): string {
  if (!searchParams) return path;
  const entries = Object.entries(searchParams).filter(
    ([, v]) => v !== undefined,
  );
  if (entries.length === 0) return path;
  const qs = new URLSearchParams();
  for (const [k, v] of entries) qs.set(k, String(v));
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${qs.toString()}`;
}

export async function apiFetch<T>(
  path: string,
  schema: ZodType<T>,
  options: FetchOptions = {},
): Promise<T> {
  const hasBody = options.body !== undefined;
  const res = await fetch(buildPath(path, options.searchParams), {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!res.ok) {
    let errors: string[] = [`HTTP ${res.status} ${res.statusText}`];
    try {
      const body = (await res.json()) as unknown;
      if (
        body &&
        typeof body === "object" &&
        "errors" in body &&
        Array.isArray((body as { errors?: unknown }).errors)
      ) {
        errors = (body as { errors: unknown[] }).errors.map(String);
      }
    } catch {
      // keep default message
    }
    throw new ApiError(res.status, errors);
  }

  if (res.status === 204) return schema.parse(undefined);
  const text = await res.text();
  if (!text) return schema.parse(undefined);
  const json: unknown = JSON.parse(text);
  return schema.parse(json);
}
