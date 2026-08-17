"use server";

import { z } from "zod";
import { isValidUsername } from "@/lib/domain/url";
import { hashPassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/auth/emails";
import { findUserByEmail, createUserWithProfile, createAuthToken } from "@/lib/repo/users";
import { isUsernameTaken } from "@/lib/repo/profiles";

const schema = z.object({
  username: z.string().refine(isValidUsername, "3-30 chars: lowercase letters, numbers, - or _"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

export type SignupState = { error?: string; success?: boolean };

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function signup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = schema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { username, email, password } = parsed.data;

  if (await isUsernameTaken(username)) {
    return { error: "That username is taken." };
  }
  if (await findUserByEmail(email)) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const { user } = await createUserWithProfile({ email, passwordHash, username });

  const { token, tokenHash } = generateToken();
  await createAuthToken(user.id, "email_verify", tokenHash, VERIFY_TOKEN_TTL_MS);
  await sendVerificationEmail(email, token);

  return { success: true };
}
