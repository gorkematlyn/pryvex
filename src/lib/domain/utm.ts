export interface UtmOverrides {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}

export interface UtmDefaults {
  source: string;
  medium: string;
  campaign: string;
  content: string;
}

/**
 * Builds the final destination URL: preserves any existing query params on
 * the destination, only fills in utm_* params that aren't already present
 * (never overwrites a param the destination URL already carries), then
 * layers per-link overrides on top of account defaults.
 */
export function buildTrackedDestination(destinationUrl: string, defaults: UtmDefaults, overrides: UtmOverrides = {}): string {
  const url = new URL(destinationUrl);

  const values: Record<string, string | undefined> = {
    utm_source: overrides.utm_source ?? defaults.source,
    utm_medium: overrides.utm_medium ?? defaults.medium,
    utm_campaign: overrides.utm_campaign ?? defaults.campaign,
    utm_content: overrides.utm_content ?? defaults.content,
  };

  for (const [key, value] of Object.entries(values)) {
    if (!value) continue;
    if (url.searchParams.has(key)) continue; // never clobber an existing param
    url.searchParams.set(key, value);
  }

  return url.toString();
}
