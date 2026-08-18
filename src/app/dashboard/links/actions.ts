"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { requireProfile } from "@/lib/domain/current-user";
import type { ActionResult } from "@/app/dashboard/actions";
import type { ShortLinkRow } from "@/lib/db/types";
import { getEntitlements, requireFeature, requireLimit } from "@/lib/domain/entitlements";
import { isValidDestinationUrl, isValidSlug } from "@/lib/domain/url";
import { createShortLink as createShortLinkRepo, isSlugTaken, toggleShortLink as toggleShortLinkRepo, deleteShortLink as deleteShortLinkRepo, countShortLinksForProfile } from "@/lib/repo/short-links";

const nanoSlug = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 7);

const schema = z.object({
  destination_url: z.string().refine(isValidDestinationUrl, "Enter a valid http(s) URL"),
  slug: z
    .string()
    .optional()
    .refine((v) => !v || isValidSlug(v), "3-40 chars: letters, numbers, - or _"),
  expires_at: z.string().optional().nullable(),
});

export async function createShortLink(input: unknown): Promise<ActionResult<ShortLinkRow>> {
  const { userId } = await requireProfile();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const [entitlements, used] = await Promise.all([
    getEntitlements(userId),
    countShortLinksForProfile(userId),
  ]);

  const denied = requireFeature(entitlements, "short_links");
  if (denied) return denied;

  const overLimit = requireLimit(entitlements, "max_short_links", used, "short links");
  if (overLimit) return overLimit;

  // A custom alias is itself a paid capability; without it the user still
  // gets a link, just a generated slug rather than a rejection.
  const wantsCustomSlug = Boolean(parsed.data.slug);
  if (wantsCustomSlug && !entitlements.features.short_link_custom_alias) {
    return { error: "Custom aliases are not included in your plan." };
  }
  if (parsed.data.expires_at && !entitlements.features.short_link_expiration) {
    return { error: "Expiration dates are not included in your plan." };
  }

  const slug = parsed.data.slug || nanoSlug();

  if (wantsCustomSlug && (await isSlugTaken(slug))) {
    return { error: "That slug is already taken." };
  }

  const data = await createShortLinkRepo({
    profileId: userId,
    slug,
    destinationUrl: parsed.data.destination_url,
    expiresAt: parsed.data.expires_at || null,
  });

  revalidatePath("/dashboard/links");
  return { data };
}

export async function toggleShortLink(id: string, isActive: boolean) {
  const { userId } = await requireProfile();
  try {
    await toggleShortLinkRepo(id, userId, isActive);
    revalidatePath("/dashboard/links");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function deleteShortLink(id: string) {
  const { userId } = await requireProfile();
  await deleteShortLinkRepo(id, userId);
  revalidatePath("/dashboard/links");
  return { success: true };
}
