import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { isValidObjectId } from "mongoose";

const tokenLifetimeSeconds = 7 * 24 * 60 * 60;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET ?? (
    process.env.NODE_ENV === "production" ? "" : "local-development-only-secret-change-before-deploy"
  );
  if (!secret) throw new Error("JWT_SECRET is required to sign authentication tokens.");
  return secret;
}

function sign(input: string) {
  return createHmac("sha256", getJwtSecret()).update(input).digest("base64url");
}

export function createAuthToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + tokenLifetimeSeconds
  })).toString("base64url");
  const content = `${header}.${payload}`;
  return `${content}.${sign(content)}`;
}

function verifyAuthToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const content = `${parts[0]}.${parts[1]}`;
  const expectedSignature = Buffer.from(sign(content), "base64url");
  const actualSignature = Buffer.from(parts[2], "base64url");
  if (expectedSignature.length !== actualSignature.length || !timingSafeEqual(expectedSignature, actualSignature)) {
    return null;
  }

  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("sub" in payload) ||
      !("exp" in payload) ||
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000) ||
      !isValidObjectId(payload.sub)
    ) {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
}

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
    }
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.get("authorization");
  if (!authorization) {
    next();
    return;
  }

  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  const userId = match ? verifyAuthToken(match[1]) : null;
  if (!userId) {
    res.status(401).json({ message: "Your session is invalid or has expired. Please sign in again." });
    return;
  }

  req.authUserId = userId;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  optionalAuth(req, res, () => {
    if (!req.authUserId) {
      res.status(401).json({ message: "Sign in to manage your recipes." });
      return;
    }
    next();
  });
}
