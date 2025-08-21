import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { query } from "./db";

import authRoutes from "./auth/routes";
import orderRoutes from "./orders/routes";
import menuRoutes from "./menu/routes";
import activitiesRoutes from "./activities/routes";
const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

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
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/menu", menuRoutes); // <-- this already serves GET /
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/activities", activitiesRoutes);

// Optional: 404 for unknown routes
app.use((_req, res) =>
  res.status(404).json({ error: { message: "Not found" } })
);

// Start
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Havenia API listening on :${port}`));
