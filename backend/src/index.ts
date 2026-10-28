import cors from "cors";
import dotenv from "dotenv";
import express, { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import { Recipe } from "./models/Recipe";
import recipeRoutes from "./routes/recipes";
import externalRecipeRoutes from "./routes/externalRecipes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 5000);
const mongoUri = process.env.MONGODB_URI ?? "";

if (!mongoUri) {
  throw new Error("MONGODB_URI is required. Copy .env.example to .env and configure MongoDB.");
}

const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("This website origin is not allowed to access the API."));
  }
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/external-recipes", externalRecipeRoutes);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof Error && error.message === "This website origin is not allowed to access the API.") {
    res.status(403).json({ message: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ message: "Something went wrong while processing your request." });
};
app.use(errorHandler);

async function start() {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in production.");
  }
  await mongoose.connect(mongoUri);
  const migration = await Recipe.updateMany(
    { owner: { $exists: false }, isPublic: { $exists: false } },
    { $set: { owner: null, isPublic: true } }
  );
  if (migration.modifiedCount > 0) {
    console.log(`Marked ${migration.modifiedCount} existing recipes as public starter recipes.`);
  }
  app.listen(port, () => {
    console.log(`Recipe API listening at http://localhost:${port}`);
  });
}

start().catch((error: unknown) => {
  console.error("Failed to connect to MongoDB:", error);
  process.exit(1);
});
