/**
 * The catalogue of everything a plan can grant.
 *
 * This registry — not the database — is the source of truth for *which*
 * capabilities exist, because every feature here corresponds to code that
 * must render or enforce it. Plans store only the answers (`{ [key]: true }`
 * in `plans.features`, `{ [key]: number }` in `plans.limits`), so adding a
 * capability is a code change here plus a checkbox in the admin matrix —
 * never a migration.
 *
 * `alwaysOn` features are shown in the admin matrix for completeness but
 * cannot be switched off; they are the floor every account gets.
 */

export type FeatureKey =
  // Link in Bio
  | "bio_page"
  | "bio_emoji"
  | "bio_icons"
  | "bio_thumbnails"
  | "bio_button_styles"
  | "bio_themes"
  | "bio_background"
  | "bio_typography"
  | "bio_seo_meta"
  | "bio_app_links"
  | "bio_hide_branding"
  // Short links
  | "short_links"
  | "short_link_custom_alias"
  | "short_link_expiration"
  // QR codes
  | "qr_codes"
  | "qr_customization"
  | "qr_logo"
  | "qr_svg_export"
  // Analytics
  | "analytics_basic"
  | "analytics_breakdowns"
  | "analytics_referrers"
  | "analytics_export"
  // Tracking & integrations
  | "utm_configuration"
  | "integration_google_analytics"
  | "integration_meta_pixel"
  | "integration_meta_capi"
  // Account
  | "search_engine_control"
  | "support_tickets"
  | "priority_support"
  | "custom_domain";

export type LimitKey =
  | "max_links"
  | "max_short_links"
  | "max_qr_codes"
  | "analytics_retention_days";

export interface FeatureDef {
  key: FeatureKey;
  label: string;
  description: string;
  /** Part of the free floor — rendered checked and disabled in the admin matrix. */
  alwaysOn?: boolean;
}

export interface LimitDef {
  key: LimitKey;
  label: string;
  description: string;
  unit: string;
}

export interface FeatureGroup {
  key: string;
  label: string;
  features: FeatureDef[];
  limits: LimitDef[];
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    key: "bio",
    label: "Link in Bio",
    features: [
      { key: "bio_page", label: "Public bio page", description: "A public pryvex page at /username.", alwaysOn: true },
      { key: "bio_emoji", label: "Link emoji", description: "Attach an emoji to any link button." },
      { key: "bio_icons", label: "Link icons", description: "Attach a built-in icon to any link button." },
      { key: "bio_thumbnails", label: "Link thumbnails", description: "Show a custom image thumbnail on link buttons." },
      { key: "bio_button_styles", label: "Button styles", description: "Change button shape, fill and border treatment." },
      { key: "bio_themes", label: "Themes", description: "Apply and customise page themes." },
      { key: "bio_background", label: "Background customisation", description: "Custom page background colour, gradient or image." },
      { key: "bio_typography", label: "Typography controls", description: "Choose the typeface and weight of the public page." },
      { key: "bio_seo_meta", label: "Custom SEO metadata", description: "Override the page title and description used by search engines and social cards." },
      { key: "bio_app_links", label: "Mobile app links", description: "Deep links to App Store / Google Play listings." },
      { key: "bio_hide_branding", label: "Remove Pryvex branding", description: "Hide the Pryvex footer badge on the public page." },
    ],
    limits: [
      { key: "max_links", label: "Links per page", description: "Maximum link blocks on the bio page.", unit: "links" },
    ],
  },
  {
    key: "short",
    label: "Short Links",
    features: [
      { key: "short_links", label: "Short links", description: "Create tracked pryvex.com/s/… short URLs." },
      { key: "short_link_custom_alias", label: "Custom aliases", description: "Choose the slug instead of getting a generated one." },
      { key: "short_link_expiration", label: "Expiration dates", description: "Automatically deactivate a short link at a set time." },
    ],
    limits: [
      { key: "max_short_links", label: "Short links", description: "Maximum active short links.", unit: "links" },
    ],
  },
  {
    key: "qr",
    label: "QR Codes",
    features: [
      { key: "qr_codes", label: "QR codes", description: "Generate tracked QR codes." },
      { key: "qr_customization", label: "Colour customisation", description: "Custom foreground/background colours and margin." },
      { key: "qr_logo", label: "Logo in QR code", description: "Embed a logo in the centre of the code." },
      { key: "qr_svg_export", label: "SVG export", description: "Download codes as vector SVG in addition to PNG." },
    ],
    limits: [
      { key: "max_qr_codes", label: "QR codes", description: "Maximum saved QR codes.", unit: "codes" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    features: [
      { key: "analytics_basic", label: "Core analytics", description: "Views, clicks and click-through rate.", alwaysOn: true },
      { key: "analytics_breakdowns", label: "Device / browser / OS breakdowns", description: "Segment traffic by device category, browser, OS and country." },
      { key: "analytics_referrers", label: "Referrer & source reporting", description: "See which sites and channels drive traffic." },
      { key: "analytics_export", label: "CSV export", description: "Download raw analytics data." },
    ],
    limits: [
      { key: "analytics_retention_days", label: "Data retention", description: "How far back analytics can be queried.", unit: "days" },
    ],
  },
  {
    key: "integrations",
    label: "Tracking & Integrations",
    features: [
      { key: "utm_configuration", label: "UTM configuration", description: "Override the automatic UTM parameters per account and per link." },
      { key: "integration_google_analytics", label: "Google Analytics", description: "Send public page views to a GA4 measurement ID." },
      { key: "integration_meta_pixel", label: "Meta Pixel", description: "Fire a Meta Pixel on the public page." },
      { key: "integration_meta_capi", label: "Meta Conversions API", description: "Server-side conversion events via a Meta CAPI token." },
      { key: "custom_domain", label: "Custom domain", description: "Serve the public page from your own domain." },
    ],
    limits: [],
  },
  {
    key: "account",
    label: "Account & Support",
    features: [
      { key: "search_engine_control", label: "Search engine & AI visibility control", description: "Toggle indexing by search engines and AI crawlers.", alwaysOn: true },
      { key: "support_tickets", label: "Support tickets", description: "Open support requests from the dashboard.", alwaysOn: true },
      { key: "priority_support", label: "Priority support", description: "Tickets are flagged for faster handling." },
    ],
    limits: [],
  },
];

/** Flat lookups, derived so the groups above stay the single definition. */
export const ALL_FEATURES: FeatureDef[] = FEATURE_GROUPS.flatMap((g) => g.features);
export const ALL_LIMITS: LimitDef[] = FEATURE_GROUPS.flatMap((g) => g.limits);

export const FEATURE_BY_KEY = new Map(ALL_FEATURES.map((f) => [f.key, f]));
export const LIMIT_BY_KEY = new Map(ALL_LIMITS.map((l) => [l.key, l]));

export const ALWAYS_ON_FEATURES: FeatureKey[] = ALL_FEATURES.filter((f) => f.alwaysOn).map((f) => f.key);

/** -1 means unlimited, everywhere a limit is compared. */
export const UNLIMITED = -1;

export function isUnlimited(value: number): boolean {
  return value === UNLIMITED;
}

/** Normalises whatever JSONB the admin saved into a complete, typed feature map. */
export function normalizeFeatures(raw: unknown): Record<FeatureKey, boolean> {
  const source = (raw ?? {}) as Record<string, unknown>;
  const out = {} as Record<FeatureKey, boolean>;
  for (const feature of ALL_FEATURES) {
    out[feature.key] = feature.alwaysOn ? true : source[feature.key] === true;
  }
  return out;
}

export function normalizeLimits(raw: unknown): Record<LimitKey, number> {
  const source = (raw ?? {}) as Record<string, unknown>;
  const out = {} as Record<LimitKey, number>;
  for (const limit of ALL_LIMITS) {
    const value = source[limit.key];
    out[limit.key] = typeof value === "number" && Number.isFinite(value) ? value : 0;
  }
  return out;
}
