#!/usr/bin/env node
// Gera o client_secret JWT que o Supabase Auth espera no campo
// external_apple_secret pra Sign in with Apple.
//
// Apple exige um JWT assinado em ES256 com a Auth Key (.p8) contendo:
//   header: { alg: "ES256", kid: "<KEY_ID>" }
//   payload: {
//     iss: "<TEAM_ID>",       // Team ID (10 chars)
//     iat: <now>,
//     exp: <now + 6 months>,  // máx permitido pela Apple
//     aud: "https://appleid.apple.com",
//     sub: "<SERVICES_ID>"    // o Services ID OAuth, ex br.com.capitaolori.web
//   }
//
// Uso:
//   node scripts/apple-jwt.mjs \
//     --p8=/path/to/AuthKey_XYZ.p8 \
//     --team=ABCDE12345 \
//     --kid=XYZ123ABCD \
//     --services=br.com.capitaolori.web
//
// Imprime o JWT no stdout.

import { readFileSync } from "node:fs";
import { createSign, createPrivateKey } from "node:crypto";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.join("=")];
  }),
);

const p8Path = args.p8;
const teamId = args.team;
const keyId = args.kid;
const servicesId = args.services;

if (!p8Path || !teamId || !keyId || !servicesId) {
  console.error("usage: node scripts/apple-jwt.mjs --p8=path --team=ID --kid=ID --services=ID");
  process.exit(1);
}

const p8Pem = readFileSync(p8Path, "utf8");

// ES256 = ECDSA over P-256 with SHA-256, JWS-format JOSE (r,s concatenated).
const now = Math.floor(Date.now() / 1000);
const header = { alg: "ES256", kid: keyId };
const payload = {
  iss: teamId,
  iat: now,
  exp: now + 60 * 60 * 24 * 30 * 6, // 6 months (Apple max)
  aud: "https://appleid.apple.com",
  sub: servicesId,
};

function b64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(JSON.stringify(input));
  return buf.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

const headerB64 = b64url(header);
const payloadB64 = b64url(payload);
const signingInput = `${headerB64}.${payloadB64}`;

const key = createPrivateKey({ key: p8Pem, format: "pem" });
// Node's createSign('SHA256') with EC keys defaults to DER-encoded sig (ASN.1).
// JWS requires raw r||s (64 bytes for P-256). Pass dsaEncoding: 'ieee-p1363'.
const sig = createSign("SHA256").update(signingInput).sign({ key, dsaEncoding: "ieee-p1363" });
const sigB64 = b64url(sig);

process.stdout.write(`${signingInput}.${sigB64}\n`);
