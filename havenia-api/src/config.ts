export const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean),
};