import pino from "pino";
import pinoHttp from "pino-http";
import crypto from "crypto";

const level =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

export const logger = pino({
  level,
  redact: {
    paths: [
      // request headers that may carry secrets
      "req.headers.authorization",
      "req.headers.cookie",
      // request bodies
      "req.body.password",
      "req.body.*.password",
    ],
    remove: true,
  },
  messageKey: "message",
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const header = (req.headers["x-request-id"] as string) || "";
    const id = header || crypto.randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  serializers: {
    req(req) {
      return {
        id: (req as any).id,
        method: req.method,
        url: req.url,
        remoteAddress: req.socket?.remoteAddress,
        user: (req as any).user?.id,
      };
    },
    res(res) {
      // We don’t log headers here, so no need to redact them.
      return { statusCode: res.statusCode };
    },
  },
});