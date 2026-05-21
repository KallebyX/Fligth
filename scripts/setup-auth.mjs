#!/usr/bin/env node
/* eslint-disable no-console */
//
// scripts/setup-auth.mjs
//
// Pusha pra o Supabase remoto:
//   1. Templates HTML de email (confirmation, recovery, magic_link, email_change, invite)
//   2. Subjects (assuntos) de cada email
//   3. Auth config crítico: site URL, redirect URLs, password min length,
//      OTP expiry, mailer autoconfirm, secure email change
//
// Pré-requisitos obrigatórios:
//   - export SUPABASE_ACCESS_TOKEN=<personal access token>
//     (gera em https://supabase.com/dashboard/account/tokens)
//   - export SUPABASE_PROJECT_REF=ggveduxfkljidzkrmmoo
//     (ou passa --project=<ref>)
//
// Opcional — habilita Google OAuth se preenchidos:
//   - export GOOGLE_OAUTH_CLIENT_ID=...apps.googleusercontent.com
//   - export GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...
//
// Opcional — habilita Apple OAuth se preenchidos:
//   - export APPLE_SERVICES_ID=br.com.capitaolori.web
//   - export APPLE_OAUTH_SECRET=<JWT compilado com .p8 OU o .p8 raw>
//
// Uso:
//   node scripts/setup-auth.mjs
//   node scripts/setup-auth.mjs --dry-run   # mostra o payload sem enviar
//   node scripts/setup-auth.mjs --project=outro-ref
//
// Idempotente: pode rodar quantas vezes quiser.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const projectArg = args.find((a) => a.startsWith("--project="));
const projectRef =
  (projectArg ? projectArg.split("=")[1] : null) ??
  process.env.SUPABASE_PROJECT_REF ??
  "ggveduxfkljidzkrmmoo";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!accessToken && !dryRun) {
  console.error("✖ SUPABASE_ACCESS_TOKEN não definido.");
  console.error("  Gera um Personal Access Token em");
  console.error("  https://supabase.com/dashboard/account/tokens");
  console.error("  então: export SUPABASE_ACCESS_TOKEN=sbp_xxxxx");
  process.exit(1);
}

function loadTemplate(name) {
  return readFileSync(join(ROOT, "supabase/templates", `${name}.html`), "utf8");
}

const SITE_URL = "https://fligth.vercel.app";
const REDIRECT_URLS = [
  "https://fligth.vercel.app/callback",
  "https://fligth-*.vercel.app/callback",
  "http://localhost:3000/callback",
  "http://localhost:3001/callback",
  // Capacitor native deep link (iOS + Android).
  "capitaolori://callback",
];

const payload = {
  // ─── Site URL + Redirects ─────────────────────────────────────────────
  site_url: SITE_URL,
  uri_allow_list: REDIRECT_URLS.join(","),

  // ─── Subjects ─────────────────────────────────────────────────────────
  mailer_subjects_confirmation: "Confirme seu email — Comandante Lorí",
  mailer_subjects_recovery: "Criar nova senha — Comandante Lorí",
  mailer_subjects_magic_link: "Seu link de acesso — Comandante Lorí",
  mailer_subjects_email_change: "Confirme seu novo email — Comandante Lorí",
  mailer_subjects_invite: "Você foi convidado — Comandante Lorí",
  mailer_subjects_reauthentication: "Confirme sua identidade — Comandante Lorí",

  // ─── HTML bodies ──────────────────────────────────────────────────────
  mailer_templates_confirmation_content: loadTemplate("confirmation"),
  mailer_templates_recovery_content: loadTemplate("recovery"),
  mailer_templates_magic_link_content: loadTemplate("magic_link"),
  mailer_templates_email_change_content: loadTemplate("email_change"),
  mailer_templates_invite_content: loadTemplate("invite"),

  // ─── Behavior flags ───────────────────────────────────────────────────
  // Exigir confirmação de email (default true) — mantém.
  mailer_autoconfirm: false,
  // Confirmação dupla pra troca de email (envia pros dois endereços).
  mailer_secure_email_change_enabled: true,
  // Senha mínima — sincroniza com a validação cliente em /signup e /reset.
  password_min_length: 6,
  // OTP / link expiry em segundos (1 hora — bate com a copy nos templates).
  mailer_otp_exp: 3600,
  // Token magic link / recovery / confirmation
  jwt_exp: 3600,
};

// ─── OAuth providers (opcionais) ──────────────────────────────────────────
// Só aplicamos quando as credenciais estão em env vars. Faltou? O field
// fica de fora do PATCH e o setting atual do projeto não muda.
const googleId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const googleSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
if (googleId && googleSecret) {
  payload.external_google_enabled = true;
  payload.external_google_client_id = googleId;
  payload.external_google_secret = googleSecret;
}

const appleId = process.env.APPLE_SERVICES_ID;
const appleSecret = process.env.APPLE_OAUTH_SECRET;
if (appleId && appleSecret) {
  payload.external_apple_enabled = true;
  payload.external_apple_client_id = appleId;
  payload.external_apple_secret = appleSecret;
}

if (dryRun) {
  console.log("dry-run — payload que seria enviado:");
  console.log(JSON.stringify(payload, null, 2).slice(0, 2000) + "\n... (truncated)");
  process.exit(0);
}

const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
console.log(`→ PATCH ${url}`);

const res = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const text = await res.text();
if (!res.ok) {
  console.error(`✖ status ${res.status}`);
  console.error(text);
  process.exit(1);
}

console.log(`✓ auth config atualizada para projeto ${projectRef}`);
console.log("  Templates de email + redirect URLs + behavior flags aplicados.");
if (payload.external_google_enabled) console.log("  ✓ Google OAuth habilitado.");
if (payload.external_apple_enabled) console.log("  ✓ Apple OAuth habilitado.");
console.log("  Faça um signup de teste pra ver os emails novos.");
