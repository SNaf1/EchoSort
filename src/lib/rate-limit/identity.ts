import { createHash } from "node:crypto";

import { getServerEnv } from "@/lib/env";

const DEFAULT_RATE_LIMIT_SALT = "echosort-rate-limit-default-salt";

let hasWarnedMissingSalt = false;

function getEffectiveSalt() {
  const env = getServerEnv();
  if (env.RATE_LIMIT_KEY_SALT && env.RATE_LIMIT_KEY_SALT.trim().length > 0) {
    return env.RATE_LIMIT_KEY_SALT.trim();
  }

  if (!hasWarnedMissingSalt) {
    hasWarnedMissingSalt = true;
    console.warn(
      "[rate-limit] RATE_LIMIT_KEY_SALT is missing; using default salt. Set a secret salt in production."
    );
  }

  return DEFAULT_RATE_LIMIT_SALT;
}

export function hashRateLimitIdentity(ip: string, salt: string) {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function buildRateLimitIdentityHash(ip: string) {
  const salt = getEffectiveSalt();
  return hashRateLimitIdentity(ip, salt);
}
