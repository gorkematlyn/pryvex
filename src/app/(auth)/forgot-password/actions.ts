"use server";

import { z } from "zod";
import { findUserByEmail, createAuthToken } from "@/lib/repo/users";
import { generateToken } from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/auth/emails";

const schema = z.object({ email: z.string().email("Enter a valid email") });

export type ForgotPasswordState = { error?: string; success?: boolean };

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Always report success — do not leak whether an email is registered.
  const user = await findUserByEmail(parsed.data.email);
  if (user) {
    const { token, tokenHash } = generateToken();
    await createAuthToken(user.id, "password_reset", tokenHash, RESET_TOKEN_TTL_MS);
    await sendPasswordResetEmail(parsed.data.email, token);
  }

  return { success: true };
}
