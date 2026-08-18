"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isReservedUsername } from "@/lib/domain/url";
import { hashPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { findUserByEmail, createUserWithProfile } from "@/lib/repo/users";
import { isUsernameTaken } from "@/lib/repo/profiles";
import { countSuperAdmins, logAdminAction } from "@/lib/repo/admin";
import { FREE_PLAN_ID } from "@/lib/repo/plans";

const schema = z.object({
  username: z
    .string()
    .regex(/^[a-z0-9_-]{3,30}$/, "3-30 chars: lowercase letters, numbers, - or _")
    .refine((v) => !isReservedUsername(v), "That handle is reserved."),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(12, "Use at least 12 characters for the owner account"),
});

export type SetupState = { error?: string };

export async function createFirstAdmin(_prev: SetupState, formData: FormData): Promise<SetupState> {
  // Re-checked here, not just in the page: the page render and this action
  // are separate requests, so the gate has to hold at the point of write.
  if ((await countSuperAdmins()) > 0) {
    return { error: "Setup has already been completed." };
  }

  const parsed = schema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { username, email, password } = parsed.data;

  if (await isUsernameTaken(username)) return { error: "That username is taken." };
  if (await findUserByEmail(email)) return { error: "An account with this email already exists." };

  const passwordHash = await hashPassword(password);
  const { user } = await createUserWithProfile({
    email,
    passwordHash,
    username,
    role: "super_admin",
    // No mail server is configured on a fresh deploy, and locking the owner
    // out of their own instance behind an email they cannot receive would
    // make the install unusable.
    emailVerified: true,
    planId: FREE_PLAN_ID,
    planDurationDays: null,
  });

  await logAdminAction({
    actorUserId: user.id,
    action: "setup.create_super_admin",
    targetType: "user",
    targetId: user.id,
    detail: { email },
  });

  await createSessionCookie(user.id);
  redirect("/admin");
}
