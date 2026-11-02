import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Router } from "express";
import { z } from "zod";
import { createAuthToken, requireAuth } from "../middleware/auth";
import { User } from "../models/User";

const scrypt = promisify(scryptCallback);
const router = Router();
const credentials = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(128) });
const registration = credentials.extend({ name: z.string().trim().min(1).max(80) });

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

async function matchesPassword(password: string, stored: string) {
  const [salt, encoded] = stored.split(":");
  if (!salt || !encoded) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(encoded, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function session(user: { _id: unknown; name: string; email: string }) {
  return { token: createAuthToken(String(user._id)), user: { id: String(user._id), name: user.name, email: user.email } };
}

router.post("/register", async (req, res, next) => {
  try {
    const parsed = registration.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid account details." }); return; }
    const email = parsed.data.email.toLowerCase();
    if (await User.exists({ email })) { res.status(409).json({ message: "An account with that email already exists." }); return; }
    const user = await User.create({ ...parsed.data, email, passwordHash: await hashPassword(parsed.data.password) });
    res.status(201).json(session(user));
  } catch (error) { next(error); }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Enter a valid email and password." }); return; }
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");
    if (!user || !(await matchesPassword(parsed.data.password, user.passwordHash))) { res.status(401).json({ message: "Invalid email or password." }); return; }
    res.json(session(user));
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.authUserId).select("name email preferences notifications");
    if (!user) { res.status(401).json({ message: "Account not found." }); return; }
    res.json(user);
  } catch (error) { next(error); }
});

export default router;
