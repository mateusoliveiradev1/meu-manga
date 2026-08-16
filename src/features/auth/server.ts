import { randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "@/db/client";
import { account, rateLimits, session, user, verification } from "@/db/schema";

const WEAK_SECRET = "desenvolva-um-segredo-longo";

function resolveSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret && secret !== WEAK_SECRET) return secret;
  if (process.env.NODE_ENV === "production") {
    // never boot production with a known/placeholder signing secret
    throw new Error(
      "BETTER_AUTH_SECRET não está definida (ou é o placeholder). Gere uma com:\n  node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\""
    );
  }
  // dev: random per boot — never ships weak; sessions just reset on restart
  return randomBytes(48).toString("base64url");
}

export const auth = betterAuth({
  appName: process.env.SITE_NAME || "Meu Mangá",
  secret: resolveSecret(),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification, rateLimit: rateLimits },
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  user: {
    deleteUser: { enabled: true },
  },
  plugins: [admin()],
  rateLimit: {
    enabled: true,
    storage: "database",
    // base bucket: 30 requests / min / IP for the auth API as a whole
    window: 60,
    max: 30,
    customRules: {
      // brute force on login: 5 attempts / min / IP
      "/sign-in/email": { window: 60, max: 5 },
      // mass account creation: 10 accounts / hour / IP
      "/sign-up/email": { window: 3600, max: 10 },
      // password reset & verification emails: 5 / hour / IP (anti email-bombing)
      "/request-password-reset": { window: 3600, max: 5 },
      "/send-verification-email": { window: 3600, max: 5 },
      "/change-password": { window: 60, max: 5 },
      "/change-email": { window: 3600, max: 5 },
    },
  },
  advanced: {
    cookiePrefix: "manga",
    ipAddress: {
      // the client IP keys the rate-limit buckets; honor the headers a
      // reverse proxy / host forwards (x-forwarded-for first)
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
    },
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
});
