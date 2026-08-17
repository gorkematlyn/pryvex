"use server";

import { z } from "zod";
import { consumeAuthToken, updatePasswordHash } from "@/lib/repo/users";
import { hashPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "At least 8 characters"),
});

export type ResetPasswordState = { error?: string; success?: boolean };

export async function updatePassword(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const userId = await consumeAuthToken(parsed.data.token, "password_reset");
  if (!userId) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await updatePasswordHash(userId, passwordHash);
  await createSessionCookie(userId);

  return { success: true };
}
