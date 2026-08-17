import { insertLinkEvent } from "@/lib/repo/link-events";
import { parseUserAgent } from "@/lib/domain/user-agent";
import { getClientIp, hashVisitorId } from "@/lib/domain/visitor";
import type { EventType, TrafficSource } from "@/lib/db/types";

export interface RecordEventInput {
  profileId: string;
  eventType: EventType;
  linkId?: string;
  shortLinkId?: string;
  qrCodeId?: string | null;
  trafficSource: TrafficSource;
  /** Only `.headers` is used — a Route Handler `Request` or a plain `{ headers }` both work. */
  request: { headers: Headers };
  utm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    content?: string | null;
  };
}

/**
 * Fire-and-forget analytics write. Never throws — a failed insert must not
 * block a visitor's redirect.
 */
export async function recordEvent(input: RecordEventInput): Promise<void> {
  try {
    const headers = input.request.headers;
    const ua = headers.get("user-agent");
    const ip = getClientIp(headers);
    const { deviceCategory, browser, os } = parseUserAgent(ua);
    const visitorId = await hashVisitorId(ip, ua ?? "unknown");
    const referrer = headers.get("referer") ?? null;
    const country = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? null;

    await insertLinkEvent({
      profileId: input.profileId,
      eventType: input.eventType,
      linkId: input.linkId ?? null,
      shortLinkId: input.shortLinkId ?? null,
      qrCodeId: input.qrCodeId ?? null,
      trafficSource: input.trafficSource,
      referrer,
      utmSource: input.utm?.source ?? null,
      utmMedium: input.utm?.medium ?? null,
      utmCampaign: input.utm?.campaign ?? null,
      utmContent: input.utm?.content ?? null,
      deviceCategory,
      browser,
      os,
      country,
      visitorId,
    });
  } catch (error) {
    console.error("recordEvent failed", error);
  }
}
