import { randomBytes, createHash } from "crypto";

/** Generates a URL-safe raw token plus the SHA-256 hash that gets stored. Only the hash ever touches the DB. */
export function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
