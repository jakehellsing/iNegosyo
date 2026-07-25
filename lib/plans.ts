import { PlanTier, Profile } from "./types";

export type { PlanTier };

/**
 * Resources that carry a per-plan usage cap.
 */
export type LimitedResource = "customers" | "orders";

/**
 * Gated features unlocked by higher tiers.
 */
export type PlanFeature = "advanced_analytics" | "data_export" | "unlimited_records";

/**
 * Per-plan resource limits. `null` means unlimited.
 * For the `custom` tier the values here are defaults; the effective limit is
 * read from the user's profile overrides (see {@link effectiveLimit}).
 */
export const PLAN_LIMITS: Record<PlanTier, Record<LimitedResource, number | null>> = {
  free: { customers: 20, orders: 50 },
  pro: { customers: null, orders: null },
  custom: { customers: null, orders: null },
};

/**
 * Features unlocked by each plan tier. For `custom`, this is the base set that
 * per-profile `features` overrides are merged onto (see {@link effectiveFeatures}).
 */
export const PLAN_FEATURES: Record<PlanTier, PlanFeature[]> = {
  free: [],
  pro: ["advanced_analytics", "data_export", "unlimited_records"],
  custom: ["advanced_analytics", "data_export", "unlimited_records"],
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  custom: "Custom",
};

export const ALL_PLANS: PlanTier[] = ["free", "pro", "custom"];

/**
 * Resolve the effective plan, downgrading an expired `pro` plan to `free`.
 * Mirrors the SQL `effective_plan_for` helper.
 */
export function effectivePlan(profile: Profile | null | undefined): PlanTier {
  if (!profile) return "free";
  if (
    profile.plan === "pro" &&
    profile.plan_expires_at &&
    new Date(profile.plan_expires_at).getTime() < Date.now()
  ) {
    return "free";
  }
  return profile.plan;
}

/**
 * Effective limit for a resource. `null` means unlimited.
 * Custom tier reads the per-profile override (`null` override = unlimited).
 */
export function effectiveLimit(
  profile: Profile | null | undefined,
  resource: LimitedResource
): number | null {
  const plan = effectivePlan(profile);
  if (plan === "custom" && profile) {
    return resource === "customers" ? profile.max_customers : profile.max_orders;
  }
  return PLAN_LIMITS[plan][resource];
}

export function isUnlimited(limit: number | null): limit is null {
  return limit === null;
}

/**
 * Effective feature set. For the custom tier, per-profile `features` overrides
 * (explicit `true`/`false`) are merged onto the base custom feature list.
 */
export function effectiveFeatures(profile: Profile | null | undefined): PlanFeature[] {
  const plan = effectivePlan(profile);
  const base = new Set<PlanFeature>(PLAN_FEATURES[plan]);
  if (plan === "custom" && profile?.features) {
    for (const [feature, enabled] of Object.entries(profile.features)) {
      if (!isPlanFeature(feature)) continue;
      if (enabled) base.add(feature);
      else base.delete(feature);
    }
  }
  return [...base];
}

export function hasFeature(
  profile: Profile | null | undefined,
  feature: PlanFeature
): boolean {
  return effectiveFeatures(profile).includes(feature);
}

function isPlanFeature(value: string): value is PlanFeature {
  return (
    value === "advanced_analytics" ||
    value === "data_export" ||
    value === "unlimited_records"
  );
}
