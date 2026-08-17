import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getProfileById } from "@/lib/repo/profiles";
import type { ProfileRow } from "@/lib/db/types";

/** Server-only helper for authenticated dashboard routes. proxy.ts already
 * guards /dashboard, but this fetches the profile row every page needs. */
export async function requireProfile(): Promise<{ profile: ProfileRow; userId: string }> {
  const session = await getSession();
  if (!session) redirect("/login");

  const profile = await getProfileById(session.userId);
  if (!profile) redirect("/login");

  return { profile, userId: session.userId };
}
