// Supabase Edge Function: dispatch-school-leads
//
// C5 (audit). Polls school_leads for rows newer than each school's
// last_delivered_at, POSTs them to school_lead_webhooks.webhook_url with
// an HMAC signature, falls back to email if delivery fails N times.
//
// Schedule: every 5 minutes. Manual invocation also supported (idempotent
// because we filter by last_delivered_at).
//
//   supabase functions deploy dispatch-school-leads \
//     --project-ref ggveduxfkljidzkrmmoo

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SchoolLead {
  id: string;
  school_id: string;
  name: string;
  email: string;
  phone: string;
  course_interest: string | null;
  message: string | null;
  source: string | null;
  utm: Record<string, unknown> | null;
  created_at: string;
}

interface Webhook {
  school_id: string;
  webhook_url: string;
  webhook_secret: string;
  failure_count: number;
  last_delivered_at: string | null;
  email_notify: string | null;
}

const MAX_FAILURES_BEFORE_EMAIL = 5;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "missing_env" }, 500);
  const supabase = createClient(url, key);

  // Pull all configured webhooks. Joins to leads happen per-webhook so the
  // last_delivered_at watermark is respected per destination.
  const { data: webhooks, error: whErr } = await supabase
    .from("school_lead_webhooks")
    .select("school_id, webhook_url, webhook_secret, failure_count, last_delivered_at, email_notify")
    .returns<Webhook[]>();
  if (whErr) return json({ error: "fetch_webhooks_failed", detail: whErr.message }, 500);

  let totalDelivered = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const wh of webhooks ?? []) {
    if (!wh.webhook_url || !wh.webhook_secret) {
      totalSkipped++;
      continue;
    }
    const since = wh.last_delivered_at ?? new Date(0).toISOString();
    const { data: leads, error: leadsErr } = await supabase
      .from("school_leads")
      .select(
        "id, school_id, name, email, phone, course_interest, message, source, utm, created_at",
      )
      .eq("school_id", wh.school_id)
      .gt("created_at", since)
      .order("created_at", { ascending: true })
      .limit(50)
      .returns<SchoolLead[]>();
    if (leadsErr) {
      totalFailed++;
      continue;
    }

    let lastSuccessAt = wh.last_delivered_at;
    let newFailureCount = wh.failure_count;
    let anySuccess = false;

    for (const lead of leads ?? []) {
      const ok = await deliverLead(wh.webhook_url, wh.webhook_secret, lead);
      if (ok) {
        anySuccess = true;
        lastSuccessAt = lead.created_at;
        totalDelivered++;
        newFailureCount = 0;
      } else {
        newFailureCount++;
        totalFailed++;
        if (newFailureCount >= MAX_FAILURES_BEFORE_EMAIL && wh.email_notify) {
          await sendEmailFallback(wh.email_notify, lead);
        }
        break; // Stop pumping leads to a failing webhook; try again next run.
      }
    }

    if (anySuccess || newFailureCount !== wh.failure_count) {
      await supabase
        .from("school_lead_webhooks")
        .update({
          failure_count: newFailureCount,
          last_delivered_at: lastSuccessAt,
        })
        .eq("school_id", wh.school_id);
    }
  }

  return json({
    ok: true,
    webhooks: webhooks?.length ?? 0,
    delivered: totalDelivered,
    failed: totalFailed,
    skipped: totalSkipped,
  });
});

async function deliverLead(webhookUrl: string, secret: string, lead: SchoolLead): Promise<boolean> {
  const body = JSON.stringify({
    event: "lead.created",
    delivered_at: new Date().toISOString(),
    lead,
  });
  const sig = await hmacSign(secret, body);
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-fligth-signature": sig,
        "x-fligth-timestamp": new Date().toISOString(),
      },
      body,
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendEmailFallback(_to: string, _lead: SchoolLead): Promise<void> {
  // Resend / Supabase email TBD. Logging-only placeholder so failures
  // don't silently disappear once we hit MAX_FAILURES_BEFORE_EMAIL.
  console.warn("[dispatch-school-leads] email fallback not configured", {
    to: _to,
    lead_id: _lead.id,
  });
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
}
