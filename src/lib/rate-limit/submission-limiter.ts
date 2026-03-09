import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { buildRateLimitIdentityHash } from "@/lib/rate-limit/identity";

type LimitReason = "minute" | "hour";

type LimitWindow = {
  windowSec: number;
  limit: number;
  reason: LimitReason;
};

type UpsertBucketInput = {
  key: string;
  identityHash: string;
  windowSec: number;
  windowStart: Date;
  expiresAt: Date;
};

type LimiterDependencies = {
  now: () => Date;
  getWindows: () => LimitWindow[];
  getIdentityHash: (ip: string) => string;
  upsertBucket: (input: UpsertBucketInput) => Promise<{ count: number }>;
  warn: (event: string, details: Record<string, unknown>) => void;
};

export type SubmissionRateLimitResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      reason: LimitReason;
      retryAfterSeconds: number;
    };

const WINDOW_EXPIRY_BUFFER_SECONDS = 120;

function toEpochSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function getWindowStartEpoch(now: Date, windowSec: number) {
  const currentSec = toEpochSeconds(now);
  return currentSec - (currentSec % windowSec);
}

function getRetryAfterSeconds(now: Date, windowStartEpoch: number, windowSec: number) {
  const windowEndMs = (windowStartEpoch + windowSec) * 1000;
  return Math.max(1, Math.ceil((windowEndMs - now.getTime()) / 1000));
}

function defaultWarn(event: string, details: Record<string, unknown>) {
  console.warn(`[rate-limit] ${event}`, details);
}

function defaultGetWindows(): LimitWindow[] {
  const env = getServerEnv();
  return [
    {
      windowSec: 60,
      limit: env.RATE_LIMIT_SUBMIT_PER_MINUTE,
      reason: "minute",
    },
    {
      windowSec: 60 * 60,
      limit: env.RATE_LIMIT_SUBMIT_PER_HOUR,
      reason: "hour",
    },
  ];
}

async function defaultUpsertBucket(input: UpsertBucketInput) {
  return prisma.rateLimitBucket.upsert({
    where: { key: input.key },
    create: {
      key: input.key,
      identityHash: input.identityHash,
      windowSec: input.windowSec,
      windowStart: input.windowStart,
      count: 1,
      expiresAt: input.expiresAt,
    },
    update: {
      count: { increment: 1 },
      expiresAt: input.expiresAt,
    },
    select: { count: true },
  });
}

export async function checkSubmissionRateLimit(
  ip: string | null,
  dependencies?: Partial<LimiterDependencies>
): Promise<SubmissionRateLimitResult> {
  const active: LimiterDependencies = {
    now: dependencies?.now ?? (() => new Date()),
    getWindows: dependencies?.getWindows ?? defaultGetWindows,
    getIdentityHash: dependencies?.getIdentityHash ?? buildRateLimitIdentityHash,
    upsertBucket: dependencies?.upsertBucket ?? defaultUpsertBucket,
    warn: dependencies?.warn ?? defaultWarn,
  };

  if (!ip) {
    active.warn("ip_missing_allowing_request", {
      policy: "fail_open",
    });
    return { allowed: true };
  }

  try {
    const now = active.now();
    const identityHash = active.getIdentityHash(ip);
    const windows = active.getWindows();

    let blocked: Extract<SubmissionRateLimitResult, { allowed: false }> | null = null;

    for (const window of windows) {
      const windowStartEpoch = getWindowStartEpoch(now, window.windowSec);
      const windowStart = new Date(windowStartEpoch * 1000);
      const expiresAt = new Date(
        (windowStartEpoch + window.windowSec + WINDOW_EXPIRY_BUFFER_SECONDS) * 1000
      );
      const key = `${identityHash}:${window.windowSec}:${windowStartEpoch}`;

      const bucket = await active.upsertBucket({
        key,
        identityHash,
        windowSec: window.windowSec,
        windowStart,
        expiresAt,
      });

      if (bucket.count <= window.limit) continue;

      const retryAfterSeconds = getRetryAfterSeconds(now, windowStartEpoch, window.windowSec);
      if (!blocked || retryAfterSeconds > blocked.retryAfterSeconds) {
        blocked = {
          allowed: false,
          reason: window.reason,
          retryAfterSeconds,
        };
      }
    }

    if (blocked) {
      return blocked;
    }

    return { allowed: true };
  } catch (error) {
    active.warn("limiter_failed_allowing_request", {
      policy: "fail_open",
      error: error instanceof Error ? error.message : String(error),
    });
    return { allowed: true };
  }
}
