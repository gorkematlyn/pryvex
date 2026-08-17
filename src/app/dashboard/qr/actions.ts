"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { requireProfile } from "@/lib/domain/current-user";
import { isValidDestinationUrl } from "@/lib/domain/url";
import { createShortLink } from "@/lib/repo/short-links";
import { createQrCode as createQrCodeRepo, deleteQrCode as deleteQrCodeRepo } from "@/lib/repo/qr-codes";

const nanoSlug = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 7);

const schema = z.object({
  target_type: z.enum(["profile", "link", "short_link", "custom"]),
  target_link_id: z.string().uuid().optional(),
  target_short_link_id: z.string().uuid().optional(),
  custom_url: z.string().optional(),
  label: z.string().max(80).optional(),
});

export async function createQrCode(input: unknown) {
  const { userId } = await requireProfile();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let targetShortLinkId = parsed.data.target_short_link_id ?? null;

  if (parsed.data.target_type === "custom") {
    if (!parsed.data.custom_url || !isValidDestinationUrl(parsed.data.custom_url)) {
      return { error: "Enter a valid http(s) URL" };
    }
    const shortLink = await createShortLink({
      profileId: userId,
      slug: nanoSlug(),
      destinationUrl: parsed.data.custom_url,
      expiresAt: null,
    });
    targetShortLinkId = shortLink.id;
  }

  if (parsed.data.target_type === "link" && !parsed.data.target_link_id) {
    return { error: "Choose a link" };
  }
  if (parsed.data.target_type === "short_link" && !targetShortLinkId) {
    return { error: "Choose a short link" };
  }

  const data = await createQrCodeRepo({
    profileId: userId,
    targetType: parsed.data.target_type,
    targetLinkId: parsed.data.target_type === "link" ? parsed.data.target_link_id ?? null : null,
    targetShortLinkId,
    customUrl: parsed.data.custom_url || null,
    label: parsed.data.label || null,
  });

  revalidatePath("/dashboard/qr");
  return { data };
}

export async function deleteQrCode(id: string) {
  const { userId } = await requireProfile();
  await deleteQrCodeRepo(id, userId);
  revalidatePath("/dashboard/qr");
  return { success: true };
}
