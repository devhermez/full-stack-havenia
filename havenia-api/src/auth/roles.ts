// src/auth/roles.ts
import type { Request, Response, NextFunction } from "express";
import type { AuthedRequest } from "./middleware";

export type Role = "user" | "staff" | "admin";

/** Middleware: require that the authenticated user has one of the allowed roles */
export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as AuthedRequest).user?.role ?? "user";
    if (!allowed.includes(role as Role)) {
      return res.status(403).json({ error: { message: "Forbidden" } });
    }
    next();
  };
}