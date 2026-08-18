import { query, queryOne } from "@/lib/db/pool";
import type { QrCodeRow, QrTargetType } from "@/lib/db/types";

export function listQrCodesByProfile(profileId: string): Promise<QrCodeRow[]> {
  return query<QrCodeRow>("select * from qr_codes where profile_id = $1 order by created_at desc", [profileId]);
}

export function getQrCodeById(id: string): Promise<QrCodeRow | null> {
  return queryOne<QrCodeRow>("select * from qr_codes where id = $1", [id]);
}

export async function createQrCode(input: {
  profileId: string;
  targetType: QrTargetType;
  targetLinkId: string | null;
  targetShortLinkId: string | null;
  customUrl: string | null;
  label: string | null;
}): Promise<QrCodeRow> {
  const row = await queryOne<QrCodeRow>(
    `insert into qr_codes (profile_id, target_type, target_link_id, target_short_link_id, custom_url, label)
     values ($1, $2, $3, $4, $5, $6) returning *`,
    [input.profileId, input.targetType, input.targetLinkId, input.targetShortLinkId, input.customUrl, input.label],
  );
  if (!row) throw new Error("Failed to create QR code");
  return row;
}

export async function deleteQrCode(id: string, profileId: string): Promise<void> {
  await query("delete from qr_codes where id = $1 and profile_id = $2", [id, profileId]);
}

/** Used by plan-limit checks before creating another QR code. */
export async function countQrCodesForProfile(profileId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from qr_codes where profile_id = $1",
    [profileId],
  );
  return Number(row?.count ?? 0);
}
