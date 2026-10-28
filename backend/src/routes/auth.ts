import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { createAuthToken, requireAuth } from "../middleware/auth";
import { User } from "../models/User";

const router = Router();
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please wait a few minutes and try again." }
});

function derivePassword(password: string, salt: Buffer, keyLength: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

const registerInput = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128)
});

const loginInput = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
});

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await derivePassword(password, salt, 64);
  return `${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

async function passwordMatches(password: string, passwordHash: string) {
  const [saltText, hashText] = passwordHash.split(":");
  if (!saltText || !hashText) return false;
  const salt = Buffer.from(saltText, "base64url");
  const expected = Buffer.from(hashText, "base64url");
  const actual = await derivePassword(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sendSession(res: import("express").Response, user: { _id: unknown; name: string; email: string }) {
  res.json({
    token: createAuthToken(String(user._id)),
    user: { id: String(user._id), name: user.name, email: user.email }
  });
}

router.post("/register", authRateLimit, async (req, res, next) => {
  const parsed = registerInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid registration details." });
    return;
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const existing = await User.exists({ email });
    if (existing) {
      res.status(409).json({ message: "An account with that email already exists. Sign in instead." });
      return;
    }

    const user = await User.create({
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password)
    });
    sendSession(res.status(201), user);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      res.status(409).json({ message: "An account with that email already exists. Sign in instead." });
      return;
    }
    next(error);
  }
});

router.post("/login", authRateLimit, async (req, res, next) => {
  const parsed = loginInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid sign-in details." });
    return;
  }

  try {
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");
    if (!user || !(await passwordMatches(parsed.data.password, user.passwordHash))) {
      res.status(401).json({ message: "Email or password is incorrect." });
      return;
    }
    sendSession(res, user);
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.authUserId).select("name email");
    if (!user) {
      res.status(401).json({ message: "Your account could not be found. Please sign in again." });
      return;
    }
    res.json({ id: String(user._id), name: user.name, email: user.email });
  } catch (error) {
    next(error);
  }
});

export default router;
