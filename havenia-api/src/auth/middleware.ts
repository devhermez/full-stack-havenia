import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "./util";

export type JwtUser = { id: string; email: string; role?: string | null };
export type AuthedRequest = Request & { user?: JwtUser };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  if (!token)
    return res.status(401).json({ error: { message: "Missing bearer token" } });

  try {
    const payload = verifyJwt<any>(token);
    const id = payload.id ?? payload.sub;
    const email = payload.email;
    if (!email || !id) throw new Error("Bad payload");
    req.user = { id, email, role: payload.role ?? "user" };
    next();
  } catch {
    return res
      .status(401)
      .json({ error: { message: "Invalid or expired token" } });
  }
}
