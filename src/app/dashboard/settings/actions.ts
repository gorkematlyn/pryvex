"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/domain/current-user";
import type { ActionResult } from "@/app/dashboard/actions";
import { getEntitlements, requireFeature } from "@/lib/domain/entitlements";
import {
  updateUserSettings,
  updateVisibilitySettings,
  updateIntegrationSettings,
} from "@/lib/repo/user-settings";

const schema = z.object({
  default_utm_source: z.string().trim().min(1).max(60),
  default_utm_medium: z.string().trim().min(1).max(60),
  auto_utm_enabled: z.boolean(),
});

export async function updateSettings(input: unknown): Promise<ActionResult> {
  const { userId } = await requireProfile();

  // Gated server-side as well as in the UI — a dimmed control is a hint,
  // not a boundary.
  const entitlements = await getEntitlements(userId);
  const denied = requireFeature(entitlements, "utm_configuration");
  if (denied) return denied;

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await updateUserSettings(userId, parsed.data);

  revalidatePath("/dashboard/settings");
  return { success: true };
}

const visibilitySchema = z.object({
  search_engine_visible: z.boolean(),
  llm_visible: z.boolean(),
});

export async function updateVisibility(input: unknown): Promise<ActionResult> {
  const { userId, profile } = await requireProfile();

  const parsed = visibilitySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await updateVisibilitySettings(userId, parsed.data);

  revalidatePath("/dashboard/settings");
  // The public page renders its robots directives from this row.
  revalidatePath(`/${profile.username}`);
  return { success: true };
}

const integrationsSchema = z.object({
  google_analytics_id: z
    .string()
    .trim()
    .regex(/^(G-[A-Z0-9]{4,}|UA-\d{4,}-\d{1,4})?$/i, "Enter a GA4 ID like G-XXXXXXX")
    .nullable(),
  meta_pixel_id: z
    .string()
    .trim()
    .regex(/^\d{10,20}$/, "A Meta Pixel ID is 10-20 digits")
    .nullable(),
  meta_conversion_api_token: z.string().trim().max(500).nullable(),
});

export async function updateIntegrations(input: {
  google_analytics_id: string;
  meta_pixel_id: string;
  meta_conversion_api_token: string;
}) {
  const { userId, profile } = await requireProfile();
  const entitlements = await getEntitlements(userId);

  // Empty string means "clear it", which is always allowed; only *setting* a
  // value requires the feature.
  const wantsGa = input.google_analytics_id.trim() !== "";
  const wantsPixel = input.meta_pixel_id.trim() !== "";
  const wantsCapi = input.meta_conversion_api_token.trim() !== "";

  if (wantsGa && !entitlements.features.integration_google_analytics) {
    return { error: "Google Analytics is not included in your plan." };
  }
  if (wantsPixel && !entitlements.features.integration_meta_pixel) {
    return { error: "Meta Pixel is not included in your plan." };
  }
  if (wantsCapi && !entitlements.features.integration_meta_capi) {
    return { error: "Meta Conversions API is not included in your plan." };
  }

  const parsed = integrationsSchema.safeParse({
    google_analytics_id: wantsGa ? input.google_analytics_id.trim() : null,
    meta_pixel_id: wantsPixel ? input.meta_pixel_id.trim() : null,
    meta_conversion_api_token: wantsCapi ? input.meta_conversion_api_token.trim() : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await updateIntegrationSettings(userId, parsed.data);

  revalidatePath("/dashboard/settings");
  revalidatePath(`/${profile.username}`);
  return { success: true };
}
