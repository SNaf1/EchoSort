import { z } from "zod";

const ServerEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  GOOGLE_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3-flash-preview"),
  RATE_LIMIT_SUBMIT_PER_MINUTE: z.coerce.number().int().positive().default(6),
  RATE_LIMIT_SUBMIT_PER_HOUR: z.coerce.number().int().positive().default(40),
  RATE_LIMIT_KEY_SALT: z.string().optional(),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

let cachedEnv: z.infer<typeof ServerEnvSchema> | null = null;

export function getServerEnv() {
  if (cachedEnv) return cachedEnv;
  const parsed = ServerEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables: ${parsed.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}`
    );
  }
  cachedEnv = parsed.data;
  return parsed.data;
}
