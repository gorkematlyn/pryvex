import { query, queryOne } from "@/lib/db/pool";
import type { UserSettingsRow } from "@/lib/db/types";

export function getUserSettings(profileId: string): Promise<UserSettingsRow | null> {
  return queryOne<UserSettingsRow>("select * from user_settings where profile_id = $1", [profileId]);
}

export async function updateUserSettings(
  profileId: string,
  input: { default_utm_source: string; default_utm_medium: string; auto_utm_enabled: boolean },
): Promise<void> {
  await query(
    "update user_settings set default_utm_source = $2, default_utm_medium = $3, auto_utm_enabled = $4 where profile_id = $1",
    [profileId, input.default_utm_source, input.default_utm_medium, input.auto_utm_enabled],
  );
}
