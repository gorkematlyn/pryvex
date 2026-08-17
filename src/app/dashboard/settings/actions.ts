"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/domain/current-user";
import { updateUserSettings } from "@/lib/repo/user-settings";

const schema = z.object({
  default_utm_source: z.string().trim().min(1).max(60),
  default_utm_medium: z.string().trim().min(1).max(60),
  auto_utm_enabled: z.boolean(),
});

export async function updateSettings(input: unknown) {
  const { userId } = await requireProfile();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await updateUserSettings(userId, parsed.data);

  revalidatePath("/dashboard/settings");
  return { success: true };
}
