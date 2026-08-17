/**
 * Derives a privacy-safe, non-reversible visitor identifier: SHA-256 of
 * (IP + user agent + day bucket), never the raw IP. Rotates daily so it
 * can't be used as a long-lived tracking cookie substitute, while still
 * letting us dedupe "unique" views/clicks within a day.
 */
export async function hashVisitorId(ip: string, userAgent: string): Promise<string> {
  const dayBucket = new Date().toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${ip}|${userAgent}|${dayBucket}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "0.0.0.0";
}
