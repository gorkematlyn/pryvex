import { query, queryOne } from "@/lib/db/pool";
import type { ShortLinkRow } from "@/lib/db/types";

export function listShortLinksByProfile(profileId: string): Promise<ShortLinkRow[]> {
  return query<ShortLinkRow>("select * from short_links where profile_id = $1 order by created_at desc", [profileId]);
}

export function getShortLinkBySlug(slug: string): Promise<ShortLinkRow | null> {
  return queryOne<ShortLinkRow>("select * from short_links where lower(slug) = lower($1)", [slug]);
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  const row = await queryOne("select id from short_links where lower(slug) = lower($1)", [slug]);
  return row !== null;
}

export async function createShortLink(input: {
  profileId: string;
  slug: string;
  destinationUrl: string;
  expiresAt: string | null;
}): Promise<ShortLinkRow> {
  const row = await queryOne<ShortLinkRow>(
    "insert into short_links (profile_id, slug, destination_url, expires_at) values ($1, $2, $3, $4) returning *",
    [input.profileId, input.slug, input.destinationUrl, input.expiresAt],
  );
  if (!row) throw new Error("Failed to create short link");
  return row;
}

export async function toggleShortLink(id: string, profileId: string, isActive: boolean): Promise<void> {
  await query("update short_links set is_active = $3 where id = $1 and profile_id = $2", [id, profileId, isActive]);
}

export async function deleteShortLink(id: string, profileId: string): Promise<void> {
  await query("delete from short_links where id = $1 and profile_id = $2", [id, profileId]);
}
