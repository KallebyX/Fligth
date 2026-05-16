"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export type LeadInput = {
  schoolId: string;
  name: string;
  email: string;
  phone: string;
  courseInterest?: string;
  message?: string;
  consent: boolean;
  source?: "directory" | "school_page" | "recommendation";
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
};

export type LeadResult =
  | { ok: true; leadId: string; reward: number }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// PT-BR phone: 10–11 digits including DDD (e.g., 11999999999) or with
// formatting characters. Accept up to 30 chars of digits + symbols.
const PHONE_RE = /^[\d\s()+\-]{8,30}$/;

export async function submitSchoolLead(input: LeadInput): Promise<LeadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  if (!input.consent) return { ok: false, error: "consent_required" };
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  if (name.length < 2 || name.length > 100) return { ok: false, error: "name_invalid" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "email_invalid" };
  if (!PHONE_RE.test(phone)) return { ok: false, error: "phone_invalid" };

  // Coarse anti-fraud: hash the requester IP so we can detect spam bursts
  // without storing PII.
  const h = await headers();
  const fwd = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "";
  const ipHash = fwd
    ? createHash("sha256").update(fwd.split(",")[0].trim()).digest("hex").slice(0, 32)
    : null;

  const { data, error } = await supabase
    .from("school_leads")
    .insert({
      school_id: input.schoolId,
      user_id: user.id,
      name,
      email,
      phone,
      course_interest: input.courseInterest?.trim() || null,
      message: input.message?.trim() || null,
      source: input.source ?? "school_page",
      utm_source: input.utm?.source ?? null,
      utm_medium: input.utm?.medium ?? null,
      utm_campaign: input.utm?.campaign ?? null,
      consent_given: true,
      ip_hash: ipHash,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }

  // Reward: +10 gems for first lead to this school (idempotent via
  // checking lead count). Best-effort — failure here doesn't roll back
  // the lead itself.
  let reward = 0;
  const { count: priorLeads } = await supabase
    .from("school_leads")
    .select("id", { count: "exact", head: true })
    .eq("school_id", input.schoolId)
    .eq("user_id", user.id);
  if ((priorLeads ?? 0) === 1) {
    reward = 10;
    const { data: stats } = await supabase
      .from("user_stats")
      .select("gems")
      .eq("user_id", user.id)
      .single();
    if (stats) {
      await supabase
        .from("user_stats")
        .update({ gems: (stats.gems ?? 0) + reward })
        .eq("user_id", user.id);
    }
  }

  revalidatePath(`/escolas`);
  return { ok: true, leadId: data.id, reward };
}
