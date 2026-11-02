import { createHmac, timingSafeEqual } from "node:crypto";
import { RequestHandler } from "express";
import dotenv from "dotenv";

dotenv.config();

const secret = process.env.JWT_SECRET ?? "";
if (process.env.NODE_ENV === "production" && secret.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters in production.");
}

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signature(input: string) {
  return createHmac("sha256", secret || "local-development-secret").update(input).digest("base64url");
}

export function createAuthToken(userId: string) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ sub: userId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 });
  return `${header}.${payload}.${signature(`${header}.${payload}`)}`;
}

function verifyToken(token: string) {
  const [header, payload, provided] = token.split(".");
  if (!header || !payload || !provided) return null;
  const expected = signature(`${header}.${payload}`);
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; exp?: number };
  return data.sub && data.exp && data.exp > Date.now() / 1000 ? data.sub : null;
}

declare global {
  namespace Express {
    interface Request { authUserId?: string; }
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const authorization = req.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const userId = match ? verifyToken(match[1]) : null;
  if (!userId) {
    res.status(401).json({ message: "Sign in to continue." });
    return;
  }
  req.authUserId = userId;
  next();
};

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const authorization = req.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (match) req.authUserId = verifyToken(match[1]) ?? undefined;
  next();
};
