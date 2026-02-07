import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { redis } from "./config/redis.js";
import routes from "./routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", routes);

// Error handler (must be last)
app.use(errorHandler);

async function start() {
  try {
    // Connect to Redis
    await redis.connect();
    console.log("Redis connected");

    app.listen(env.PORT, () => {
      console.log(
        `Backend API Server running on port ${env.PORT} [${env.NODE_ENV}]`
      );
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
