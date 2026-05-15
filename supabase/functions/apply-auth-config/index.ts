// apply-auth-config — pushes email templates + auth config to the
// Supabase Management API. Sandbox networks (like Claude's) can't reach
// api.supabase.com directly; Edge Functions can.
//
// POST with body { token, project_ref, branch?, oauth? } where:
//   - token: Supabase Personal Access Token (sbp_...)
//   - project_ref: e.g. 'ggveduxfkljidzkrmmoo'
//   - branch: git ref for the templates source (default 'claude/anac-pilot-training-app-sVhHF')
//   - oauth (optional): { google?: {client_id, secret}, apple?: {client_id, secret} }
//
// Curl:
//   curl -X POST 'https://<ref>.supabase.co/functions/v1/apply-auth-config' \
//     -H 'Authorization: Bearer <ANON_KEY>' \
//     -H 'Content-Type: application/json' \
//     -d '{"token":"sbp_...","project_ref":"<ref>"}'

// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TEMPLATE_NAMES = ["confirmation", "recovery", "magic_link", "email_change", "invite"] as const;
type TemplateName = typeof TEMPLATE_NAMES[number];

async function fetchTemplate(branch: string, name: TemplateName): Promise<string> {
  const url = `https://raw.githubusercontent.com/KallebyX/Fligth/${branch}/supabase/templates/${name}.html`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch template ${name}: ${res.status}`);
  return await res.text();
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const body = (await req.json().catch(() => null)) as {
    token?: string;
    project_ref?: string;
    branch?: string;
    oauth?: {
      google?: { client_id: string; secret: string };
      apple?: { client_id: string; secret: string };
    };
  } | null;
  if (!body?.token || !body?.project_ref) {
    return new Response(JSON.stringify({ error: "missing token or project_ref" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const branch = body.branch ?? "claude/anac-pilot-training-app-sVhHF";

  let templates: Record<TemplateName, string>;
  try {
    const entries = await Promise.all(
      TEMPLATE_NAMES.map(async (n) => [n, await fetchTemplate(branch, n)] as const),
    );
    templates = Object.fromEntries(entries) as Record<TemplateName, string>;
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "template_fetch_failed", detail: String(err) }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const payload: Record<string, unknown> = {
    site_url: "https://fligth.vercel.app",
    uri_allow_list: [
      "https://fligth.vercel.app/callback",
      "https://fligth-*.vercel.app/callback",
      "http://localhost:3000/callback",
      "http://localhost:3001/callback",
      "capitaolori://callback",
    ].join(","),
    mailer_subjects_confirmation: "Confirme seu email — Capitão Lorí",
    mailer_subjects_recovery: "Criar nova senha — Capitão Lorí",
    mailer_subjects_magic_link: "Seu link de acesso — Capitão Lorí",
    mailer_subjects_email_change: "Confirme seu novo email — Capitão Lorí",
    mailer_subjects_invite: "Você foi convidado — Capitão Lorí",
    mailer_subjects_reauthentication: "Confirme sua identidade — Capitão Lorí",
    mailer_templates_confirmation_content: templates.confirmation,
    mailer_templates_recovery_content: templates.recovery,
    mailer_templates_magic_link_content: templates.magic_link,
    mailer_templates_email_change_content: templates.email_change,
    mailer_templates_invite_content: templates.invite,
    mailer_autoconfirm: false,
    mailer_secure_email_change_enabled: true,
    password_min_length: 6,
    mailer_otp_exp: 3600,
    jwt_exp: 3600,
  };

  if (body.oauth?.google) {
    payload.external_google_enabled = true;
    payload.external_google_client_id = body.oauth.google.client_id;
    payload.external_google_secret = body.oauth.google.secret;
  }
  if (body.oauth?.apple) {
    payload.external_apple_enabled = true;
    payload.external_apple_client_id = body.oauth.apple.client_id;
    payload.external_apple_secret = body.oauth.apple.secret;
  }

  const url = `https://api.supabase.com/v1/projects/${body.project_ref}/config/auth`;
  const upstream = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${body.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await upstream.text();
  return new Response(text || JSON.stringify({ ok: upstream.ok, status: upstream.status }), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
});
