export const queryKeys = {
  issues: {
    all: ["issues"] as const,
    list: (params?: Record<string, string | number | undefined>) =>
      ["issues", "list", params ?? {}] as const,
  },
  meta: {
    all: ["meta"] as const,
    root: () => ["meta"] as const,
  },
} as const;
