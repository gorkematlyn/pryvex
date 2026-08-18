"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireSuperAdmin } from "@/lib/domain/current-admin";
import { logAdminAction, setUserRole, resolveAudience } from "@/lib/repo/admin";
import { assignPlan, extendSubscription, setSubscriptionExpiry, assignPlanToUsers } from "@/lib/repo/subscriptions";
import { getPlanById } from "@/lib/repo/plans";
import { findUserById, createAuthToken } from "@/lib/repo/users";
import { notifyUser, notifyUsers } from "@/lib/repo/notifications";
import { generateToken } from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/auth/emails";

export type ActionResult = { error?: string; success?: string };

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Turns "N days from now" into a concrete timestamp, or null for no expiry. */
function expiryFromDays(days: number | null): string | null {
  if (days === null || days <= 0) return null;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

const changePlanSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid(),
  durationDays: z.number().int().min(0).nullable(),
  notify: z.boolean(),
});

export async function changeUserPlan(input: {
  userId: string;
  planId: string;
  durationDays: number | null;
  notify: boolean;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = changePlanSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input." };

  const plan = await getPlanById(parsed.data.planId);
  if (!plan) return { error: "That plan no longer exists." };

  const user = await findUserById(parsed.data.userId);
  if (!user) return { error: "That user no longer exists." };

  // An explicit duration wins; otherwise inherit the plan's own term.
  const days = parsed.data.durationDays ?? plan.duration_days;
  const expiresAt = expiryFromDays(days);

  await assignPlan({
    userId: parsed.data.userId,
    planId: parsed.data.planId,
    expiresAt,
    source: "admin",
    note: `changed by ${admin.email}`,
  });

  if (parsed.data.notify) {
    await notifyUser(parsed.data.userId, {
      title: `Your plan is now ${plan.name}`,
      body: expiresAt
        ? `An administrator moved your account to the ${plan.name} plan. It is valid until ${new Date(expiresAt).toLocaleDateString()}.`
        : `An administrator moved your account to the ${plan.name} plan.`,
      level: "success",
      actionUrl: "/dashboard/billing",
    });
  }

  await logAdminAction({
    actorUserId: admin.id,
    action: "user.change_plan",
    targetType: "user",
    targetId: parsed.data.userId,
    detail: { plan: plan.slug, expiresAt },
  });

  revalidatePath(`/admin/users/${parsed.data.userId}`);
  revalidatePath("/admin/users");
  return { success: `Moved to ${plan.name}.` };
}

export async function extendUserPlan(userId: string, days: number): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(days) || days === 0 || Math.abs(days) > 3650) {
    return { error: "Enter a whole number of days (max 3650)." };
  }

  await extendSubscription(userId, days);
  await logAdminAction({
    actorUserId: admin.id,
    action: days > 0 ? "user.extend_plan" : "user.shorten_plan",
    targetType: "user",
    targetId: userId,
    detail: { days },
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: days > 0 ? `Extended by ${days} days.` : `Shortened by ${Math.abs(days)} days.` };
}

export async function clearUserExpiry(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  await setSubscriptionExpiry(userId, null);
  await logAdminAction({
    actorUserId: admin.id,
    action: "user.clear_expiry",
    targetType: "user",
    targetId: userId,
  });
  revalidatePath(`/admin/users/${userId}`);
  return { success: "Subscription no longer expires." };
}

export async function sendUserPasswordReset(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const user = await findUserById(userId);
  if (!user) return { error: "That user no longer exists." };

  const { token, tokenHash } = generateToken();
  await createAuthToken(user.id, "password_reset", tokenHash, RESET_TOKEN_TTL_MS);

  // Mail failure must not look like success — the admin needs to know the
  // user did not actually receive anything.
  try {
    await sendPasswordResetEmail(user.email, token);
  } catch {
    return { error: "Could not send the email. Check the SMTP settings." };
  }

  await logAdminAction({
    actorUserId: admin.id,
    action: "user.send_password_reset",
    targetType: "user",
    targetId: userId,
  });

  return { success: `Reset link sent to ${user.email}.` };
}

export async function sendUserNotification(input: {
  userId: string;
  title: string;
  body: string;
  level: "info" | "success" | "warning" | "critical";
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!input.title.trim() || !input.body.trim()) return { error: "Title and message are required." };

  await notifyUser(input.userId, {
    title: input.title.trim(),
    body: input.body.trim(),
    level: input.level,
  });

  await logAdminAction({
    actorUserId: admin.id,
    action: "user.notify",
    targetType: "user",
    targetId: input.userId,
    detail: { title: input.title },
  });

  revalidatePath(`/admin/users/${input.userId}`);
  return { success: "Notification sent." };
}

export async function changeUserRole(
  userId: string,
  role: "user" | "admin" | "super_admin",
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (userId === admin.id) return { error: "You cannot change your own role." };

  await setUserRole(userId, role);
  await logAdminAction({
    actorUserId: admin.id,
    action: "user.change_role",
    targetType: "user",
    targetId: userId,
    detail: { role },
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return { success: `Role set to ${role.replace("_", " ")}.` };
}

// ---- bulk operations ----

export interface Audience {
  scope: "all" | "plan" | "selected";
  planId?: string;
  userIds?: string[];
}

export async function bulkAssignPlan(input: {
  audience: Audience;
  planId: string;
  durationDays: number | null;
  notify: boolean;
}): Promise<ActionResult> {
  const admin = await requireAdmin();

  const plan = await getPlanById(input.planId);
  if (!plan) return { error: "That plan no longer exists." };

  const userIds = await resolveAudience(input.audience);
  if (userIds.length === 0) return { error: "That audience matched no users." };

  const days = input.durationDays ?? plan.duration_days;
  const expiresAt = expiryFromDays(days);

  const count = await assignPlanToUsers({
    userIds,
    planId: input.planId,
    expiresAt,
    note: `bulk assignment by ${admin.email}`,
  });

  if (input.notify) {
    await notifyUsers(userIds, {
      title: `Your plan is now ${plan.name}`,
      body: expiresAt
        ? `Your account was moved to the ${plan.name} plan, valid until ${new Date(expiresAt).toLocaleDateString()}.`
        : `Your account was moved to the ${plan.name} plan.`,
      level: "success",
      actionUrl: "/dashboard/billing",
    });
  }

  await logAdminAction({
    actorUserId: admin.id,
    action: "users.bulk_assign_plan",
    targetType: "plan",
    targetId: input.planId,
    detail: { count, scope: input.audience.scope },
  });

  revalidatePath("/admin/users");
  return { success: `${count} account${count === 1 ? "" : "s"} moved to ${plan.name}.` };
}

export async function bulkNotify(input: {
  audience: Audience;
  title: string;
  body: string;
  level: "info" | "success" | "warning" | "critical";
  actionUrl?: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!input.title.trim() || !input.body.trim()) return { error: "Title and message are required." };

  const userIds = await resolveAudience(input.audience);
  if (userIds.length === 0) return { error: "That audience matched no users." };

  const count = await notifyUsers(userIds, {
    title: input.title.trim(),
    body: input.body.trim(),
    level: input.level,
    actionUrl: input.actionUrl?.trim() || null,
  });

  await logAdminAction({
    actorUserId: admin.id,
    action: "users.bulk_notify",
    detail: { count, scope: input.audience.scope, title: input.title },
  });

  return { success: `Sent to ${count} account${count === 1 ? "" : "s"}.` };
}
