import { query, queryOne, withTransaction } from "@/lib/db/pool";
import type { UserRow, AuthTokenRow, ProfileRow, UserRole } from "@/lib/db/types";
import { hashToken } from "@/lib/auth/tokens";

export function findUserByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>("select * from users where lower(email) = lower($1)", [email]);
}

export function findUserById(id: string): Promise<UserRow | null> {
  return queryOne<UserRow>("select * from users where id = $1", [id]);
}

/**
 * Creates the user + profile + primary bio page + settings row + opening
 * subscription atomically. The subscription is part of the same
 * transaction because an account without one has no entitlements at all,
 * so a half-completed signup would leave a user who cannot use anything.
 */
export async function createUserWithProfile(input: {
  email: string;
  passwordHash: string;
  username: string;
  role?: UserRole;
  emailVerified?: boolean;
  planId: string;
  planDurationDays: number | null;
}): Promise<{ user: UserRow; profile: ProfileRow }> {
  return withTransaction(async (client) => {
    const { rows: userRows } = await client.query<UserRow>(
      `insert into users (email, password_hash, role, email_verified_at)
       values ($1, $2, $3, case when $4::boolean then now() else null end)
       returning *`,
      [input.email, input.passwordHash, input.role ?? "user", input.emailVerified ?? false],
    );
    const user = userRows[0];

    const { rows: profileRows } = await client.query<ProfileRow>(
      "insert into profiles (id, username, display_name) values ($1, $2, $2) returning *",
      [user.id, input.username],
    );
    const profile = profileRows[0];

    await client.query(
      "insert into bio_pages (profile_id, is_primary, is_published) values ($1, true, true)",
      [profile.id],
    );

    await client.query("insert into user_settings (profile_id) values ($1)", [profile.id]);

    const expiresAt =
      input.planDurationDays && input.planDurationDays > 0
        ? new Date(Date.now() + input.planDurationDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    await client.query(
      "insert into subscriptions (user_id, plan_id, status, expires_at, source) values ($1, $2, 'active', $3, 'signup')",
      [user.id, input.planId, expiresAt],
    );

    return { user, profile };
  });
}

export async function markEmailVerified(userId: string): Promise<void> {
  await query("update users set email_verified_at = now() where id = $1", [userId]);
}

export async function updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
  await query("update users set password_hash = $1 where id = $2", [passwordHash, userId]);
}

// ---- one-time tokens (email verification / password reset) ----

export async function createAuthToken(
  userId: string,
  type: "email_verify" | "password_reset",
  tokenHash: string,
  ttlMs: number,
): Promise<void> {
  await query("insert into auth_tokens (user_id, token_hash, type, expires_at) values ($1, $2, $3, $4)", [
    userId,
    tokenHash,
    type,
    new Date(Date.now() + ttlMs).toISOString(),
  ]);
}

/** Looks up a valid, unused, unexpired token by its raw value and marks it used atomically. Returns the associated user id, or null if invalid. */
export async function consumeAuthToken(
  rawToken: string,
  type: "email_verify" | "password_reset",
): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  return withTransaction(async (client) => {
    const { rows } = await client.query<AuthTokenRow>(
      `select * from auth_tokens
       where token_hash = $1 and type = $2 and used_at is null and expires_at > now()
       for update`,
      [tokenHash, type],
    );
    const record = rows[0];
    if (!record) return null;

    await client.query("update auth_tokens set used_at = now() where id = $1", [record.id]);
    return record.user_id;
  });
}
