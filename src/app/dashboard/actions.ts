"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/domain/current-user";
import { isValidDestinationUrl } from "@/lib/domain/url";
import { getPrimaryBioPage } from "@/lib/repo/bio-pages";
import * as linksRepo from "@/lib/repo/links";
import { updateProfile as updateProfileRepo } from "@/lib/repo/profiles";

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

export async function createLink(input: unknown) {
  const { userId } = await requireProfile();
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const bioPage = await getPrimaryBioPage(userId);
  if (!bioPage) return { error: "No bio page found" };

  try {
    const data = await linksRepo.createLink({
      bioPageId: bioPage.id,
      profileId: userId,
      title: parsed.data.title,
      url: parsed.data.url,
      emoji: parsed.data.emoji || null,
      icon: parsed.data.icon || null,
      thumbnailUrl: parsed.data.thumbnail_url || null,
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
      emoji: parsed.data.emoji || null,
      icon: parsed.data.icon || null,
      thumbnailUrl: parsed.data.thumbnail_url || null,
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

export async function duplicateLink(id: string) {
  const { userId } = await requireProfile();
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
