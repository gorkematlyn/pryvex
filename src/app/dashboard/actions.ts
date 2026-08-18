"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/domain/current-user";
import { getEntitlements, requireLimit } from "@/lib/domain/entitlements";
import { isValidDestinationUrl } from "@/lib/domain/url";
import { getPrimaryBioPage } from "@/lib/repo/bio-pages";
import * as linksRepo from "@/lib/repo/links";
import { updateProfile as updateProfileRepo } from "@/lib/repo/profiles";
import type { LinkRow } from "@/lib/db/types";

/**
 * Optional-field result rather than a discriminated union: callers read
 * `.error` and `.data` on the same object, and adding an early return in an
 * action shouldn't narrow the type out from under every call site.
 */
export type ActionResult<T = never> = { error?: string; data?: T; success?: boolean };

const linkSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  url: z.string().refine(isValidDestinationUrl, "Enter a valid http(s) URL"),
  emoji: z.string().max(8).optional().nullable(),
  icon: z.string().max(60).optional().nullable(),
  thumbnail_url: z.string().url().max(1000).optional().nullable().or(z.literal("")),
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

/**
 * Strips fields the plan doesn't grant instead of rejecting the whole save.
 * A user who downgrades still edits links that carry a thumbnail; failing
 * the edit would trap them, so the ungranted field is simply not written.
 */
async function applyLinkEntitlements(
  userId: string,
  data: { emoji?: string | null; icon?: string | null; thumbnail_url?: string | null },
) {
  const entitlements = await getEntitlements(userId);
  return {
    emoji: entitlements.features.bio_emoji ? data.emoji || null : null,
    icon: entitlements.features.bio_icons ? data.icon || null : null,
    thumbnailUrl: entitlements.features.bio_thumbnails ? data.thumbnail_url || null : null,
  };
}

export async function createLink(input: unknown): Promise<ActionResult<LinkRow>> {
  const { userId } = await requireProfile();
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const bioPage = await getPrimaryBioPage(userId);
  if (!bioPage) return { error: "No bio page found" };

  // Enforced here, not only in the UI — the button being hidden is not a
  // control, and the count is read at write time so two tabs cannot both
  // slip past the cap.
  const [entitlements, used] = await Promise.all([
    getEntitlements(userId),
    linksRepo.countLinksForProfile(userId),
  ]);
  const overLimit = requireLimit(entitlements, "max_links", used, "links");
  if (overLimit) return overLimit;

  try {
    const data = await linksRepo.createLink({
      bioPageId: bioPage.id,
      profileId: userId,
      title: parsed.data.title,
      url: parsed.data.url,
      ...(await applyLinkEntitlements(userId, parsed.data)),
    });
    revalidatePath("/dashboard");
    return { data };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function updateLink(id: string, input: unknown) {
  const { userId } = await requireProfile();
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await linksRepo.updateLink(id, userId, {
      title: parsed.data.title,
      url: parsed.data.url,
      ...(await applyLinkEntitlements(userId, parsed.data)),
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function deleteLink(id: string) {
  const { userId } = await requireProfile();
  try {
    await linksRepo.deleteLink(id, userId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function duplicateLink(id: string): Promise<ActionResult<LinkRow>> {
  const { userId } = await requireProfile();

  // Duplication adds a row, so it is bounded by the same cap as creation.
  const [entitlements, used] = await Promise.all([
    getEntitlements(userId),
    linksRepo.countLinksForProfile(userId),
  ]);
  const overLimit = requireLimit(entitlements, "max_links", used, "links");
  if (overLimit) return overLimit;

  try {
    const data = await linksRepo.duplicateLink(id, userId);
    if (!data) return { error: "Link not found" };
    revalidatePath("/dashboard");
    return { data };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function toggleLink(id: string, isEnabled: boolean) {
  const { userId } = await requireProfile();
  try {
    await linksRepo.toggleLink(id, userId, isEnabled);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function reorderLinks(orderedIds: string[]) {
  const { userId } = await requireProfile();
  try {
    await linksRepo.reorderLinks(userId, orderedIds);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

const profileSchema = z.object({
  display_name: z.string().trim().max(80).optional().nullable(),
  bio: z.string().trim().max(280).optional().nullable(),
  avatar_url: z.string().url().max(1000).optional().nullable().or(z.literal("")),
});

export async function updateProfile(input: unknown) {
  const { userId } = await requireProfile();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await updateProfileRepo(userId, {
      display_name: parsed.data.display_name || null,
      bio: parsed.data.bio || null,
      avatar_url: parsed.data.avatar_url || null,
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
