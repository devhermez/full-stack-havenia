import type { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";
import { logger } from "./logging";

const isProd = process.env.NODE_ENV === "production";

type AnyErr = Error & {
  status?: number;
  statusCode?: number;
  code?: string;
  type?: string;
};

function toHttp(err: AnyErr): { status: number; code: string; message: string; details?: any } {
  // Zod validation
  if (err instanceof ZodError) {
    return {
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Invalid request",
      details: z.treeifyError(err),
    };
  }

  // Stripe (shape-safe check)
  if ((err as any).type && String((err as any).type).startsWith("Stripe")) {
    return {
      status: 402,
      code: "PAYMENT_ERROR",
      message: (err as any).message ?? "Payment error",
      details: isProd ? undefined : err, // hide in prod
    };
  }

  // Postgres (RDS Data API) common codes
  if (err.code === "23505") {
    return { status: 409, code: "CONFLICT", message: "Resource already exists" };
  }
  if (err.code === "23503") {
    return { status: 409, code: "FK_CONSTRAINT", message: "Related resource missing" };
  }
  if (err.code === "22P02") {
    return { status: 400, code: "INVALID_INPUT", message: "Invalid input syntax" };
  }

  // Custom http-errors style
  const status = err.statusCode || err.status || 500;
  const code = err.code || (status >= 500 ? "INTERNAL" : "BAD_REQUEST");
  const message =
    status >= 500
      ? "Something went wrong"
      : err.message || "Bad request";

  return { status, code, message };
}

export function errorHandler(err: AnyErr, req: Request, res: Response, _next: NextFunction) {
  const { status, code, message, details } = toHttp(err);
  // log server errors with stack
  if (status >= 500) {
    logger.error({ err, reqId: (req as any).id }, "Unhandled error");
  } else {
    logger.warn({ err: isProd ? undefined : err, reqId: (req as any).id }, "Handled error");
  }

  res.status(status).json({
    error: {
      code,
      message,
      ...(details && !isProd ? { details } : {}),
      request_id: (req as any).id,
    },
  });
}