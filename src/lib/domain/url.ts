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

/**
 * Handles that must never become a public profile.
 *
 * Two reasons. First, every one of these collides with a real route:
 * Next resolves static segments before `/[username]`, so the account would
 * silently get an unreachable public page. Second, handles like `admin`,
 * `support` and `billing` are impersonation bait regardless of routing.
 * Keep in sync when adding a top-level route.
 */
const RESERVED_USERNAMES = new Set([
  // real routes
  "admin", "setup", "dashboard", "login", "logout", "signup", "auth", "api",
  "go", "s", "qr", "analytics", "settings", "links", "pricing", "about",
  "blog", "docs", "help", "terms", "privacy", "legal", "status",
  // impersonation-prone
  "support", "billing", "security", "staff", "team", "official", "pryvex",
  "root", "system", "moderator", "mod", "www", "mail", "info", "contact",
  "abuse", "postmaster", "webmaster", "null", "undefined",
]);

export function isReservedUsername(input: string): boolean {
  return RESERVED_USERNAMES.has(input.trim().toLowerCase());
}

export function isValidUsername(input: string): boolean {
  return USERNAME_RE.test(input) && !isReservedUsername(input);
}

export function isValidSlug(input: string): boolean {
  return SLUG_RE.test(input);
}
