// src/middleware/rateLimit.ts
import rateLimit from "express-rate-limit";
import type { Request } from "express";

// IPv6‑safe IP key helper.
// Uses express-rate-limit’s helper if available (runtime), otherwise normalizes IPv4-mapped IPv6 (::ffff:1.2.3.4).
function ipKey(req: Request): string {
  const anyRL = rateLimit as unknown as { ipKeyGenerator?: (r: Request) => string };
  if (typeof anyRL.ipKeyGenerator === "function") {
    return anyRL.ipKeyGenerator(req);
  }
  const ip = req.ip || "";
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

// If/when you add Redis, swap the store here.
function baseLimiter(opts: Parameters<typeof rateLimit>[0]) {
  return rateLimit(opts);
}

/** Global: generous but protective */
export const globalLimiter = baseLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300, // v7 uses "limit"
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests" } },
});

/** Auth endpoints: tighter to resist brute force */
export const authLimiter = baseLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKey(req),
  message: { error: { code: "RATE_LIMITED", message: "Too many auth attempts" } },
});

/** Payments: throttle PI creation; key = userId:ip */
export const paymentsLimiter = baseLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request & { user?: { id?: string } }) =>
    `${req.user?.id ?? "anon"}:${ipKey(req)}`,
  message: { error: { code: "RATE_LIMITED", message: "Too many payment attempts" } },
});