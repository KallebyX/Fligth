// Supabase Edge Function: send-daily-reminder
//
// Runs hourly. Asks Postgres for every user whose local reminder hour
// matches now-in-their-tz, who hasn't trained today, who opted in to
// push_streak, and who is not pending account deletion. Fires one push
// per match via the existing send-push Edge Function.
//
// Schedule: cron 'send_daily_reminder' (every hour at minute 0) — the
// SQL side is just a placeholder until the vault secret pattern is
// wired in (see notify_streak_risk for the template). For now invoke
// from an external scheduler:
//
//   curl -X POST "$SUPABASE_URL/functions/v1/send-daily-reminder" \
//     -H "Authorization: Bearer $SERVICE_ROLE_KEY"
//
// Deploy:
//   supabase functions deploy send-daily-reminder \
//     --project-ref ggveduxfkljidzkrmmoo

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Target {
  user_id: string;
  current_streak: number;
  display_name: string;
}

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
  if (!url || !key) {
    return json({ error: "missing_env" }, 500);
  }
  const supabase = createClient(url, key);

  const hourUtc = new Date().getUTCHours();
  const { data: targets, error } = await supabase.rpc("daily_reminder_targets", {
    hour_utc: hourUtc,
  });
  if (error) {
    return json({ error: "rpc_failed", detail: error.message }, 500);
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const t of (targets as Target[]) ?? []) {
    const title = "Hora de voar, Capitão!";
    const body = t.current_streak === 1
      ? "Sua ofensiva começou ontem — não deixe quebrar."
      : `Sua ofensiva de ${t.current_streak} dias está esperando.`;
    const { error: pushErr } = await supabase.functions.invoke("send-push", {
      body: { user_id: t.user_id, title, body, data: { url: "/learn" } },
    });
    if (pushErr) {
      failed++;
      errors.push(`${t.user_id}: ${pushErr.message}`);
    } else {
      sent++;
    }
  }

  return json({
    ok: true,
    hourUtc,
    targets: (targets as Target[])?.length ?? 0,
    sent,
    failed,
    errors: errors.slice(0, 10),
  });
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
}
