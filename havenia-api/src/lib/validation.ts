import { z } from "zod";

export type ValidationError = ReturnType<typeof z.treeifyError>;

export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown
): { ok: true; data: T } | { ok: false; error: ValidationError } {
  const r = schema.safeParse(data);
  if (r.success) return { ok: true, data: r.data };
  return { ok: false, error: z.treeifyError(r.error) };
}
