import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
// import morgan from "morgan";
import { httpLogger } from "./middleware/logging";
import { authLimiter, globalLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errors";
import { CONFIG } from "./config";
import { query } from "./db";
import paymentsRoutes, {
  handleWebhook,
  stripeWebhook,
} from "./payments/routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs";

import authRoutes from "./auth/routes";
import orderRoutes from "./orders/routes";
import menuRoutes from "./menu/routes";
import activitiesRoutes from "./activities/routes";
import roomsRoutes from "./rooms/routes";
import addressRoutes from "./addresses/routes";
import adminRoutes from "./admin/routes";

const app = express();
app.use(httpLogger);
// Middlewares
// app.use(cors({ origin: true, credentials: true }));
// app.use(morgan("dev"));

app.post("/api/v1/payments/webhook", stripeWebhook, handleWebhook);

app.use(
  helmet({
    // Adjust CSP later when you host frontend/assets
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl / same-origin
      if (CONFIG.CORS_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("CORS not allowed"), false);
    },
    credentials: true,
  })
);
app.use(globalLimiter);
app.use(express.json({ limit: "1mb" }));

// ... after CORS/helmet/json/etc and BEFORE 404 handler:
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// also serve raw JSON (useful for generators/clients)
app.get("/openapi.json", (_req, res) => res.json(swaggerSpec));

// Health
app.get("/healthz", (_req, res) => res.status(200).send("ok"));
app.get("/readiness", async (_req, res) => {
  try {
    await query("SELECT 1 AS ok");
    res.status(200).send("ready");
  } catch (e: any) {
    res.status(500).send(e?.message ?? "not ready");
  }
});

// API routes

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/menu", menuRoutes); // <-- this already serves GET /
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/activities", activitiesRoutes);
app.use("/api/v1/rooms", roomsRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/admin", adminRoutes);

// Optional: 404 for unknown routes
app.use((_req, res) =>
  res.status(404).json({ error: { message: "Not found" } })
);

app.use(errorHandler);

// Start
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Havenia API listening on :${port}`));
