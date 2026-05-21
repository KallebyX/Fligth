import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Handles every redirect-style flow into the app:
//   - OAuth (?code=...): from signInWithOAuth(google|apple|...)
//   - Email confirm + magic links (?code=...): newer Supabase PKCE
//   - Email confirm + recovery (?token_hash=...&type=...): legacy template
//   - Reset password: same shape as recovery
//
// After authenticating, redirects to either ?next= (if provided) or, for
// first-time users (profile.username IS NULL), to /onboarding regardless
// of next so they pick an @ and daily goal before hitting /learn.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextParam = url.searchParams.get("next") ?? "/learn";
  const refCode = url.searchParams.get("ref"); // optional referral code

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createClient();

  let exchangeError: { message: string } | null = null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    exchangeError = error;
  }

  if (exchangeError) {
    const errUrl = new URL("/login", request.url);
    errUrl.searchParams.set("error", exchangeError.message);
    return NextResponse.redirect(errUrl);
  }

  // First-time OAuth or email-confirm users land here without a chosen
  // username. Route them to /onboarding (regardless of `next`) so they
  // pick an @ and daily goal before getting dropped into the trail.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    // Stamp referral relationship if this user came in via a ?ref= link.
    // The actual Pro grant happens later (after the 3rd lesson) — see
    // maybeGrantReferralReward in app/actions/completeLesson.ts.
    if (refCode) {
      try {
        const { attachReferral } = await import("@/app/actions/referrals");
        await attachReferral(refCode);
      } catch {
        // Don't block sign-in on a bad referral attribution.
      }
    }

    if (!profile?.username && nextParam !== "/onboarding" && nextParam !== "/reset-password") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return NextResponse.redirect(new URL(nextParam, request.url));
}
