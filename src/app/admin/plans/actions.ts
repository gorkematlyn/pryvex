"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/domain/current-admin";
import { logAdminAction } from "@/lib/repo/admin";
import {
  createPlan,
  updatePlan,
  deletePlan,
  getPlanById,
  countActiveSubscribers,
  type PlanInput,
} from "@/lib/repo/plans";
import { migrateSubscribers } from "@/lib/repo/subscriptions";
import { notifyUsers } from "@/lib/repo/notifications";
import { normalizeFeatures, normalizeLimits } from "@/lib/domain/features";

export type PlanActionResult = { error?: string; success?: string; planId?: string };

const planSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9_-]{2,40}$/, "Slug: 2-40 lowercase letters, numbers, - or _"),
  name: z.string().min(1, "Name is required").max(60),
  description: z.string().max(300).nullable(),
  price_amount: z.number().min(0, "Price cannot be negative").max(1_000_000),
  price_currency: z.string().min(3).max(3),
  billing_period: z.enum(["free", "monthly", "yearly", "lifetime"]),
  duration_days: z.number().int().min(0).max(36500).nullable(),
  features: z.record(z.string(), z.boolean()),
  limits: z.record(z.string(), z.number()),
  is_active: z.boolean(),
  is_public: z.boolean(),
  position: z.number().int().min(0).max(999),
});

function toPlanInput(parsed: z.infer<typeof planSchema>): PlanInput {
  return {
    ...parsed,
    // Round-trip through the registry so an unknown key sent by a stale
    // client can never be persisted, and every known key is always present.
    features: normalizeFeatures(parsed.features),
    limits: normalizeLimits(parsed.limits),
    duration_days: parsed.duration_days === 0 ? null : parsed.duration_days,
  };
}

export async function savePlan(
  planId: string | null,
  input: unknown,
): Promise<PlanActionResult> {
  const admin = await requireSuperAdmin();

  const parsed = planSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid plan" };
  }

  const planInput = toPlanInput(parsed.data);

  try {
    if (planId) {
      const existing = await getPlanById(planId);
      if (!existing) return { error: "That plan no longer exists." };

      // The system plan is the fallback for expired/lapsed accounts and for
      // signups when the configured default is missing — it must stay
      // usable, so its availability flags are pinned.
      if (existing.is_system) {
        planInput.is_active = true;
        planInput.slug = existing.slug;
      }

      await updatePlan(planId, planInput);
      await logAdminAction({
        actorUserId: admin.id,
        action: "plan.update",
        targetType: "plan",
        targetId: planId,
        detail: { slug: planInput.slug },
      });
      revalidatePath("/admin/plans");
      return { success: `${planInput.name} saved.`, planId };
    }

    const created = await createPlan(planInput);
    await logAdminAction({
      actorUserId: admin.id,
      action: "plan.create",
      targetType: "plan",
      targetId: created.id,
      detail: { slug: created.slug },
    });
    revalidatePath("/admin/plans");
    return { success: `${created.name} created.`, planId: created.id };
  } catch (error) {
    if (error instanceof Error && error.message.includes("plans_slug_key")) {
      return { error: "That slug is already used by another plan." };
    }
    throw error;
  }
}

export async function getPlanDeletionImpact(
  planId: string,
): Promise<{ subscribers: number; isSystem: boolean }> {
  await requireSuperAdmin();
  const plan = await getPlanById(planId);
  const subscribers = await countActiveSubscribers(planId);
  return { subscribers, isSystem: plan?.is_system ?? false };
}

export async function deletePlanAction(input: {
  planId: string;
  migrateToPlanId: string;
  notify: boolean;
}): Promise<PlanActionResult> {
  const admin = await requireSuperAdmin();

  const plan = await getPlanById(input.planId);
  if (!plan) return { error: "That plan no longer exists." };
  if (plan.is_system) return { error: "The system Free plan cannot be deleted." };

  const target = await getPlanById(input.migrateToPlanId);
  if (!target) return { error: "Pick a plan to move existing subscribers to." };
  if (target.id === plan.id) return { error: "Pick a different plan to move subscribers to." };

  // subscriptions.plan_id is `on delete restrict`, so subscribers must be
  // moved before the row can go — that constraint is what guarantees an
  // account can never be left pointing at a plan that no longer exists.
  const movedUserIds = await migrateSubscribers(plan.id, target.id);

  if (input.notify && movedUserIds.length > 0) {
    await notifyUsers(movedUserIds, {
      title: `The ${plan.name} plan has been retired`,
      body:
        `Your account has been moved to ${target.name}. ` +
        `Choose a plan the next time you renew to keep the features you were using.`,
      level: "warning",
      actionUrl: "/dashboard/billing",
    });
  }

  await deletePlan(plan.id);

  await logAdminAction({
    actorUserId: admin.id,
    action: "plan.delete",
    targetType: "plan",
    targetId: plan.id,
    detail: { slug: plan.slug, migratedTo: target.slug, affected: movedUserIds.length },
  });

  revalidatePath("/admin/plans");
  return {
    success:
      movedUserIds.length > 0
        ? `${plan.name} deleted. ${movedUserIds.length} account${movedUserIds.length === 1 ? "" : "s"} moved to ${target.name}.`
        : `${plan.name} deleted.`,
  };
}
