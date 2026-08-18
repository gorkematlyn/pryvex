import { redirect } from "next/navigation";
import { cache } from "react";
import { getSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/repo/users";
import type { UserRow } from "@/lib/db/types";

/**
 * Admin authorization is resolved from the database on every request, not
 * from the session JWT. Roles change from the admin panel and a token
 * minted before a demotion must not keep working — the cost is one indexed
 * primary-key lookup, deduped per request.
 */
export const getCurrentAdmin = cache(async (): Promise<UserRow | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await findUserById(session.userId);
  if (!user) return null;
  if (user.role !== "admin" && user.role !== "super_admin") return null;

  return user;
});

export async function requireAdmin(): Promise<UserRow> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/dashboard");
  return admin;
}

/** Destructive/structural operations (plans, roles, gateway credentials). */
export async function requireSuperAdmin(): Promise<UserRow> {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "super_admin") redirect("/admin");
  return admin;
}

export function isSuperAdmin(user: Pick<UserRow, "role"> | null): boolean {
  return user?.role === "super_admin";
}
