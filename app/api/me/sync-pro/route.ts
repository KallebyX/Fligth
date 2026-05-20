import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Best-effort Pro entitlement reconciliation called from native shells
 * right after launch. The native client has just read the RevenueCat
 * customerInfo cache and saw `pro` is active; this endpoint nudges the
 * server to fetch authoritative state from RevenueCat and update
 * user_stats.pro_until.
 *
 * The actual write of pro_until happens in the standard webhook path
 * (/api/revenuecat/webhook). This endpoint just answers "yes I see
 * you, the webhook will arrive shortly" so the client can decide
 * whether to refresh the page.
 *
 * Note: we DO NOT hit RevenueCat's REST API from here (would require
 * an REST API key in env). Pro entitlement source of truth remains
 * the webhook-fed `pro_until` column. This route is a placeholder for
 * future expansion (could call RC's REST API to reconcile if a
 * webhook gets lost).
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const service = createServiceClient();
    const { data: stats } = await service
      .from("user_stats")
      .select("pro_until, pro_plan")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      ok: true,
      pro_until: stats?.pro_until ?? null,
      pro_plan: stats?.pro_plan ?? null,
    });
  } catch (err) {
    console.error("[me/sync-pro] error", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
