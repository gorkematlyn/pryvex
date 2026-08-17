import { query, queryOne } from "@/lib/db/pool";
import type { ProfileRow } from "@/lib/db/types";

export function getProfileById(id: string): Promise<ProfileRow | null> {
  return queryOne<ProfileRow>("select * from profiles where id = $1", [id]);
}

export function getProfileByUsername(username: string): Promise<ProfileRow | null> {
  return queryOne<ProfileRow>("select * from profiles where lower(username) = lower($1)", [username]);
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const row = await queryOne("select id from profiles where lower(username) = lower($1)", [username]);
  return row !== null;
}

export async function updateProfile(
  id: string,
  input: { display_name: string | null; bio: string | null; avatar_url: string | null },
): Promise<void> {
  await query(
    "update profiles set display_name = $2, bio = $3, avatar_url = $4 where id = $1",
    [id, input.display_name, input.bio, input.avatar_url],
  );
}
