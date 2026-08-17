export type EventType = "profile_view" | "link_click" | "short_link_click" | "qr_scan";
export type TrafficSource = "bio_page" | "short_link" | "qr_code" | "direct";
export type QrTargetType = "profile" | "link" | "short_link" | "custom";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  type: "email_verify" | "password_reset";
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BioPageRow {
  id: string;
  profile_id: string;
  is_primary: boolean;
  is_published: boolean;
  theme_id: string | null;
  theme_overrides: Record<string, unknown>;
  background: Record<string, unknown>;
  typography: Record<string, unknown>;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkRow {
  id: string;
  bio_page_id: string;
  profile_id: string;
  block_type: "link";
  title: string;
  url: string;
  emoji: string | null;
  icon: string | null;
  thumbnail_url: string | null;
  style: Record<string, unknown>;
  utm_overrides: Record<string, string>;
  position: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShortLinkRow {
  id: string;
  profile_id: string;
  slug: string;
  destination_url: string;
  utm_overrides: Record<string, string>;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QrCodeRow {
  id: string;
  profile_id: string;
  target_type: QrTargetType;
  target_link_id: string | null;
  target_short_link_id: string | null;
  custom_url: string | null;
  label: string | null;
  style: Record<string, unknown>;
  created_at: string;
}

export interface LinkEventRow {
  id: string;
  profile_id: string;
  event_type: EventType;
  link_id: string | null;
  short_link_id: string | null;
  qr_code_id: string | null;
  traffic_source: TrafficSource;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  device_category: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  visitor_id: string | null;
  created_at: string;
}

export interface UserSettingsRow {
  profile_id: string;
  default_utm_source: string;
  default_utm_medium: string;
  auto_utm_enabled: boolean;
  created_at: string;
  updated_at: string;
}
