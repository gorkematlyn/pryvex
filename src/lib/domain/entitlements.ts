import { cache } from "react";
import type { PlanRow } from "@/lib/db/types";
import { FREE_PLAN_ID, getPlanById } from "@/lib/repo/plans";
import { getActiveSubscription } from "@/lib/repo/subscriptions";
import {
  normalizeFeatures,
  normalizeLimits,
  isUnlimited,
  type FeatureKey,
  type LimitKey,
} from "@/lib/domain/features";

export interface Entitlements {
  plan: PlanRow | null;
  /** The plan the user paid for, even if it has lapsed — for "your X plan expired" messaging. */
  lapsedPlan: PlanRow | null;
  expiresAt: string | null;
  isExpired: boolean;
  features: Record<FeatureKey, boolean>;
  limits: Record<LimitKey, number>;
}

/**
 * Resolves what a user is allowed to do.
 *
 * A subscription past its `expires_at` does not grant its plan's features:
 * the account silently falls back to the Free plan's entitlements while
 * still reporting `isExpired` + `lapsedPlan` so the UI can prompt a
 * renewal. Deduped per request via React `cache`, since nearly every
 * dashboard page and several Server Actions ask for it.
 */
export const getEntitlements = cache(async (userId: string): Promise<Entitlements> => {
  const [subscription, freePlan] = await Promise.all([
    getActiveSubscription(userId),
    getPlanById(FREE_PLAN_ID),
  ]);

  const expiresAt = subscription?.expires_at ?? null;
  const isExpired = expiresAt !== null && new Date(expiresAt).getTime() < Date.now();

  // An inactive plan (admin toggled it off) also stops granting features.
  const subscribedPlan = subscription?.plan ?? null;
  const effectivePlan =
    subscribedPlan && !isExpired && subscribedPlan.is_active ? subscribedPlan : freePlan;

  return {
    plan: effectivePlan,
    lapsedPlan: isExpired ? subscribedPlan : null,
    expiresAt,
    isExpired,
    features: normalizeFeatures(effectivePlan?.features),
    limits: normalizeLimits(effectivePlan?.limits),
  };
});

export function hasFeature(entitlements: Entitlements, key: FeatureKey): boolean {
  return entitlements.features[key] === true;
}

/** Kept out of component bodies so reading the clock stays outside render. */
export function hasLapsed(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

/** Server-side guard for Server Actions. Returns an error object rather than throwing so actions can return it directly. */
export function requireFeature(
  entitlements: Entitlements,
  key: FeatureKey,
): { error: string } | null {
  if (hasFeature(entitlements, key)) return null;
  return { error: "Your current plan does not include this feature." };
}

export interface LimitCheck {
  limit: number;
  used: number;
  unlimited: boolean;
  remaining: number;
  reached: boolean;
}

export function checkLimit(entitlements: Entitlements, key: LimitKey, used: number): LimitCheck {
  const limit = entitlements.limits[key] ?? 0;
  const unlimited = isUnlimited(limit);
  return {
    limit,
    used,
    unlimited,
    remaining: unlimited ? Number.POSITIVE_INFINITY : Math.max(0, limit - used),
    reached: !unlimited && used >= limit,
  };
}

export function requireLimit(
  entitlements: Entitlements,
  key: LimitKey,
  used: number,
  noun: string,
): { error: string } | null {
  const check = checkLimit(entitlements, key, used);
  if (!check.reached) return null;
  return {
    error: `Your plan allows ${check.limit} ${noun}. Upgrade to add more.`,
  };
}

/** Analytics queries clamp their window to what the plan retains. */
export function clampRetentionDays(entitlements: Entitlements, requestedDays: number): number {
  const retention = entitlements.limits.analytics_retention_days ?? 0;
  if (isUnlimited(retention)) return requestedDays;
  if (retention <= 0) return requestedDays;
  return Math.min(requestedDays, retention);
}
