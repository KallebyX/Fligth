// Supabase Edge Function: send-push
//
// Recebe um payload { user_id, title, body, data? } e envia push para todos
// os device tokens ativos do usuário. Usa APNs HTTP/2 (iOS) e FCM HTTP v1
// (Android). Web push fica pra outro flow via service worker.
//
// Setup necessário (no Supabase Dashboard → Edge Functions → secrets):
//
//  APNS_TEAM_ID         - Apple Developer Team ID (10 chars)
//  APNS_KEY_ID          - APNs Auth Key ID (10 chars)
//  APNS_PRIVATE_KEY     - conteúdo do .p8 (inclui BEGIN/END)
//  APNS_BUNDLE_ID       - br.com.capitaolori.app
//  APNS_HOST            - "api.push.apple.com" (prod) | "api.sandbox.push.apple.com" (dev)
//
//  FCM_PROJECT_ID       - Firebase project id (futuro Android)
//  FCM_SERVICE_ACCOUNT  - JSON do service account (futuro Android)
//
// Deploy:
//   supabase functions deploy send-push --project-ref ggveduxfkljidzkrmmoo
//
// Chamada de exemplo (server-side, via service role):
//   const { data } = await supabase.functions.invoke("send-push", {
//     body: { user_id: "...", title: "Sua streak está em risco!", body: "..." }
//   });
//
// Triggers comuns que devem chamar isto:
//  - cron diário às 20h: streak risk para usuários sem atividade hoje
//  - league reset weekly: promoção/relegação
//  - friend_followed em user_activities: aviso de novo seguidor

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

type Payload = {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

async function buildApnsJwt(): Promise<string> {
  const teamId = Deno.env.get("APNS_TEAM_ID");
  const keyId = Deno.env.get("APNS_KEY_ID");
  const pemKey = Deno.env.get("APNS_PRIVATE_KEY");
  if (!teamId || !keyId || !pemKey) throw new Error("apns_env_missing");

  // Convert PEM to CryptoKey for ES256 signing.
  const pemBody = pemKey
    .replace(/-----[A-Z ]+-----/g, "")
    .replace(/\s+/g, "");
  const raw = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    raw,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  return await create(
    { alg: "ES256", kid: keyId },
    { iss: teamId, iat: getNumericDate(0) },
    key,
  );
}

async function sendAPNs(token: string, title: string, body: string, data?: Record<string, string>) {
  const host = Deno.env.get("APNS_HOST") ?? "api.sandbox.push.apple.com";
  const bundle = Deno.env.get("APNS_BUNDLE_ID") ?? "br.com.capitaolori.app";
  const jwt = await buildApnsJwt();
  const payload = {
    aps: { alert: { title, body }, sound: "default" },
    ...(data ?? {}),
  };
  const res = await fetch(`https://${host}/3/device/${token}`, {
    method: "POST",
    headers: {
      Authorization: `bearer ${jwt}`,
      "apns-topic": bundle,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }
  const input = (await req.json()) as Payload;
  if (!input.user_id || !input.title || !input.body) {
    return new Response(JSON.stringify({ error: "invalid_payload" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("token, platform")
    .eq("user_id", input.user_id)
    .is("revoked_at", null);

  const results: any[] = [];
  for (const t of tokens ?? []) {
    if (t.platform === "ios") {
      try {
        const r = await sendAPNs(t.token, input.title, input.body, input.data);
        results.push({ platform: "ios", ok: r.ok, status: r.status });
        // Auto-revoke 410 Gone (token no longer valid).
        if (r.status === 410) {
          await supabase
            .from("push_tokens")
            .update({ revoked_at: new Date().toISOString() })
            .eq("token", t.token);
        }
      } catch (e) {
        results.push({ platform: "ios", ok: false, error: String(e) });
      }
    } else if (t.platform === "android") {
      // FCM HTTP v1 integration would go here. Skipped for first iteration.
      results.push({ platform: "android", ok: false, error: "fcm_not_implemented" });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
});
