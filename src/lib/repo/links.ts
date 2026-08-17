import { query, queryOne } from "@/lib/db/pool";
import type { LinkRow } from "@/lib/db/types";

export function listLinksByBioPage(bioPageId: string): Promise<LinkRow[]> {
  return query<LinkRow>("select * from links where bio_page_id = $1 order by position asc", [bioPageId]);
}

export function listEnabledLinksByBioPage(bioPageId: string): Promise<LinkRow[]> {
  return query<LinkRow>(
    "select * from links where bio_page_id = $1 and is_enabled = true order by position asc",
    [bioPageId],
  );
}

export function getLinkById(id: string): Promise<LinkRow | null> {
  return queryOne<LinkRow>("select * from links where id = $1", [id]);
}

export function getOwnedLinkById(id: string, profileId: string): Promise<LinkRow | null> {
  return queryOne<LinkRow>("select * from links where id = $1 and profile_id = $2", [id, profileId]);
}

async function nextPosition(bioPageId: string): Promise<number> {
  const row = await queryOne<{ max: number | null }>(
    "select max(position) as max from links where bio_page_id = $1",
    [bioPageId],
  );
  return (row?.max ?? -1) + 1;
}

export async function createLink(input: {
  bioPageId: string;
  profileId: string;
  title: string;
  url: string;
  emoji: string | null;
  icon: string | null;
  thumbnailUrl: string | null;
}): Promise<LinkRow> {
  const position = await nextPosition(input.bioPageId);
  const row = await queryOne<LinkRow>(
    `insert into links (bio_page_id, profile_id, title, url, emoji, icon, thumbnail_url, position)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
    [input.bioPageId, input.profileId, input.title, input.url, input.emoji, input.icon, input.thumbnailUrl, position],
  );
  if (!row) throw new Error("Failed to create link");
  return row;
}

export async function updateLink(
  id: string,
  profileId: string,
  input: { title: string; url: string; emoji: string | null; icon: string | null; thumbnailUrl: string | null },
): Promise<void> {
  await query(
    `update links set title = $3, url = $4, emoji = $5, icon = $6, thumbnail_url = $7
     where id = $1 and profile_id = $2`,
    [id, profileId, input.title, input.url, input.emoji, input.icon, input.thumbnailUrl],
  );
}

export async function deleteLink(id: string, profileId: string): Promise<void> {
  await query("delete from links where id = $1 and profile_id = $2", [id, profileId]);
}

export async function duplicateLink(id: string, profileId: string): Promise<LinkRow | null> {
  const original = await getOwnedLinkById(id, profileId);
  if (!original) return null;

  const position = await nextPosition(original.bio_page_id);
  return queryOne<LinkRow>(
    `insert into links (bio_page_id, profile_id, title, url, emoji, icon, thumbnail_url, style, utm_overrides, is_enabled, position)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *`,
    [
      original.bio_page_id,
      profileId,
      `${original.title} (copy)`,
      original.url,
      original.emoji,
      original.icon,
      original.thumbnail_url,
      JSON.stringify(original.style),
      JSON.stringify(original.utm_overrides),
      original.is_enabled,
      position,
    ],
  );
}

export async function toggleLink(id: string, profileId: string, isEnabled: boolean): Promise<void> {
  await query("update links set is_enabled = $3 where id = $1 and profile_id = $2", [id, profileId, isEnabled]);
}

export async function reorderLinks(profileId: string, orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      query("update links set position = $3 where id = $1 and profile_id = $2", [id, profileId, index]),
    ),
  );
}
