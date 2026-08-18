export type EventType = "profile_view" | "link_click" | "short_link_click" | "qr_scan";
export type TrafficSource = "bio_page" | "short_link" | "qr_code" | "direct";
export type QrTargetType = "profile" | "link" | "short_link" | "custom";

export type UserRole = "user" | "admin" | "super_admin";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: string | null;
  role: UserRole;
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
  search_engine_visible: boolean;
  llm_visible: boolean;
  google_analytics_id: string | null;
  meta_pixel_id: string | null;
  meta_conversion_api_token: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------
// Plans, subscriptions, billing
// ---------------------------------------------------------

export type BillingPeriod = "free" | "monthly" | "yearly" | "lifetime";
export type SubscriptionStatus = "active" | "expired" | "cancelled";
export type SubscriptionSource = "signup" | "admin" | "payment";
export type PaymentProvider = "paytr" | "paypal" | "stripe" | "manual";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface PlanRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_amount: number;
  price_currency: string;
  billing_period: BillingPeriod;
  duration_days: number | null;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  is_active: boolean;
  is_public: boolean;
  is_system: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  source: SubscriptionSource;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  provider: PaymentProvider;
  provider_ref: string | null;
  merchant_oid: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  raw: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------
// Notifications, support, admin
// ---------------------------------------------------------

export type NotificationLevel = "info" | "success" | "warning" | "critical";
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high";

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  level: NotificationLevel;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface SupportTicketRow {
  id: string;
  user_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessageRow {
  id: string;
  ticket_id: string;
  author_user_id: string | null;
  is_staff: boolean;
  body: string;
  created_at: string;
}

export interface AppSettingRow {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface AdminAuditLogRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}
