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

export async function updateVisibilitySettings(
  profileId: string,
  input: { search_engine_visible: boolean; llm_visible: boolean },
): Promise<void> {
  await query(
    "update user_settings set search_engine_visible = $2, llm_visible = $3 where profile_id = $1",
    [profileId, input.search_engine_visible, input.llm_visible],
  );
}

/**
 * Per-account third-party tracking IDs. Written as null when the plan does
 * not grant the corresponding integration, so a downgrade cannot leave a
 * pixel firing that the user can no longer see or manage.
 */
export async function updateIntegrationSettings(
  profileId: string,
  input: {
    google_analytics_id: string | null;
    meta_pixel_id: string | null;
    meta_conversion_api_token: string | null;
  },
): Promise<void> {
  await query(
    `update user_settings
        set google_analytics_id = $2, meta_pixel_id = $3, meta_conversion_api_token = $4
      where profile_id = $1`,
    [
      profileId,
      input.google_analytics_id,
      input.meta_pixel_id,
      input.meta_conversion_api_token,
    ],
  );
}
