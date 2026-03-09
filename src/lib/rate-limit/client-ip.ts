import { isIP } from "node:net";

type HeaderReader = Pick<Headers, "get">;

const IP_HEADER_PRIORITY = [
  "x-forwarded-for",
  "x-real-ip",
  "x-vercel-forwarded-for",
  "cf-connecting-ip",
] as const;

function unwrapQuotedValue(value: string) {
  if (value.startsWith('"') && value.endsWith('"') && value.length > 1) {
    return value.slice(1, -1);
  }
  return value;
}

function stripPort(ip: string) {
  if (ip.startsWith("[")) {
    const end = ip.indexOf("]");
    if (end > 0) return ip.slice(1, end);
  }

  if (ip.includes(".") && ip.includes(":")) {
    const lastColon = ip.lastIndexOf(":");
    const maybePort = ip.slice(lastColon + 1);
    if (/^\d+$/.test(maybePort)) {
      return ip.slice(0, lastColon);
    }
  }

  return ip;
}

export function normalizeIp(rawIp: string): string | null {
  const withoutQuotes = unwrapQuotedValue(rawIp.trim());
  if (!withoutQuotes) return null;

  const withoutPort = stripPort(withoutQuotes).trim();
  if (!withoutPort) return null;

  const normalized = withoutPort.toLowerCase().startsWith("::ffff:")
    ? withoutPort.slice(7)
    : withoutPort;

  return isIP(normalized) ? normalized : null;
}

export function extractClientIpFromHeaders(headers: HeaderReader): string | null {
  for (const headerName of IP_HEADER_PRIORITY) {
    const value = headers.get(headerName);
    if (!value) continue;

    const firstCandidate = value
      .split(",")
      .map((part) => part.trim())
      .find((part) => part.length > 0);

    if (!firstCandidate) continue;
    const normalized = normalizeIp(firstCandidate);
    if (normalized) return normalized;
  }

  return null;
}
