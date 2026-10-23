import cors from "cors";
import dotenv from "dotenv";
import express, { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import recipeRoutes from "./routes/recipes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 5000);
const mongoUri = process.env.MONGODB_URI ?? "";

if (!mongoUri) {
  throw new Error("MONGODB_URI is required. Copy .env.example to .env and configure MongoDB.");
}

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});
app.use("/api/recipes", recipeRoutes);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong while processing your request." });
};
app.use(errorHandler);

async function start() {
  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`Recipe API listening at http://localhost:${port}`);
  });
}

start().catch((error: unknown) => {
  console.error("Failed to connect to MongoDB:", error);
  process.exit(1);
});
