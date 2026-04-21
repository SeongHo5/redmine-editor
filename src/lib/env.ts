import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  REDMINE_BASE_URL: z
    .string()
    .min(1, "REDMINE_BASE_URL is required")
    .url("REDMINE_BASE_URL must be a valid URL")
    .transform((v) => v.replace(/\/$/, "")),
  REDMINE_API_KEY: z.string().min(1, "REDMINE_API_KEY is required"),
});

const parsed = EnvSchema.safeParse({
  REDMINE_BASE_URL: process.env.REDMINE_BASE_URL,
  REDMINE_API_KEY: process.env.REDMINE_API_KEY,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment configuration. Check .env.local against .env.local.example:\n${issues}`,
  );
}

export const env = parsed.data;
