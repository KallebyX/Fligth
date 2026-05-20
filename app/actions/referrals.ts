"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type ReferralStatus = {
  code: string;
  inviteUrl: string;
  totalCredited: number;
  daysGranted: number;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://capitaolori.com";

export async function getReferralStatus(): Promise<ReferralStatus | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.referral_code) return null;

  const { data: credits } = await supabase
    .from("referral_credits")
    .select("pro_days_granted")
    .eq("referrer_id", user.id);
  const totalCredited = credits?.length ?? 0;
  const daysGranted = (credits ?? []).reduce(
    (sum, c) => sum + (c.pro_days_granted ?? 0),
    0,
  );

  return {
    code: profile.referral_code,
    inviteUrl: `${SITE_URL}/signup?ref=${profile.referral_code}`,
    totalCredited,
    daysGranted,
  };
}

// Called during /callback when a new user lands with ?ref=CODE. Stamps
// the relationship on profiles.referred_by; the actual reward is granted
// later, after the referred user proves they're a real human (3 lessons).
export async function attachReferral(refCode: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const code = refCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return;

  const service = createServiceClient();
  const { data: referrer } = await service
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();
  if (!referrer || referrer.id === user.id) return; // self-ref blocked

  // Only set if not already set (one-shot).
  await service
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", user.id)
    .is("referred_by", null);
}

// Called from completeLesson after the user's 3rd lifetime lesson —
// triggers the actual Pro grant for the referrer. Idempotent via the
// (referrer_id, referred_id) UNIQUE constraint on referral_credits.
export async function maybeGrantReferralReward(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const service = createServiceClient();

  const { data: me } = await service
    .from("profiles")
    .select("referred_by")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.referred_by) return;

  // Have I completed at least 3 lessons?
  const { count: lessonCount } = await service
    .from("user_progress")
    .select("lesson_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("completed_at", "is", null);
  if ((lessonCount ?? 0) < 3) return;

  // Already credited? UNIQUE constraint would throw — but we check first
  // so we can fast-path skip without an insert attempt.
  const { count: alreadyCredited } = await service
    .from("referral_credits")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", me.referred_by)
    .eq("referred_id", user.id);
  if ((alreadyCredited ?? 0) > 0) return;

  // Grant 30 days of Pro to the referrer.
  const { data: referrerStats } = await service
    .from("user_stats")
    .select("pro_until, pro_plan")
    .eq("user_id", me.referred_by)
    .maybeSingle();

  const now = Date.now();
  const currentEnd = referrerStats?.pro_until
    ? Math.max(new Date(referrerStats.pro_until).getTime(), now)
    : now;
  const newEnd = new Date(currentEnd + 30 * 24 * 60 * 60 * 1000).toISOString();

  await service
    .from("user_stats")
    .update({
      pro_until: newEnd,
      pro_plan: referrerStats?.pro_plan ?? "trial",
    })
    .eq("user_id", me.referred_by);

  await service.from("referral_credits").insert({
    referrer_id: me.referred_by,
    referred_id: user.id,
    pro_days_granted: 30,
  });

  revalidatePath("/profile");
}
