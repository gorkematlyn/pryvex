/** Validates a user-supplied destination URL. Only http/https absolute URLs are allowed. */
export function isValidDestinationUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;
const SLUG_RE = /^[a-zA-Z0-9_-]{3,40}$/;

export function isValidUsername(input: string): boolean {
  return USERNAME_RE.test(input);
}

export function isValidSlug(input: string): boolean {
  return SLUG_RE.test(input);
}
