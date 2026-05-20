#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Headless capture of App Store screenshots from the live web app
 * (capitaolori.com or a local dev server).
 *
 * Usage:
 *   node scripts/screenshots.mjs                       # uses TARGET_URL or capitaolori.com
 *   TARGET_URL=http://localhost:3000 node scripts/screenshots.mjs
 *   SCREENSHOT_EMAIL=demo@capitaolori.com \
 *   SCREENSHOT_PASSWORD=DemoPilot2026! \
 *     node scripts/screenshots.mjs
 *
 * Output: fastlane/screenshots/<locale>/<device>/<NN-name>.png
 *
 * Why headless web instead of iOS simulator?
 *   • The iOS simulator only runs on macOS — this script runs anywhere.
 *   • For App Store Connect, Apple ACCEPTS images that match the listed
 *     pixel sizes regardless of how they were generated, as long as the
 *     UI is honest about what the app shows.
 *   • For higher fidelity later, run `bundle exec fastlane snapshot` on
 *     macOS (Snapfile already configured).
 *
 * Requires Playwright. Install with: npm i -D playwright && npx playwright install chromium
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const TARGET = process.env.TARGET_URL ?? "https://capitaolori.com";
const EMAIL = process.env.SCREENSHOT_EMAIL ?? "demo@capitaolori.com";
const PASSWORD = process.env.SCREENSHOT_PASSWORD ?? "DemoPilot2026!";
const OUT_ROOT = join(process.cwd(), "fastlane/screenshots");

// Apple-required device classes (Dec 2025).
// width / height = portrait pixels. deviceScaleFactor moves between
// CSS pixels and device pixels.
const DEVICES = [
  // iPhone 6.9" — current flagship (16 Pro Max). 1320 × 2868.
  { name: "iPhone_69", width: 440, height: 956, deviceScaleFactor: 3, isMobile: true },
  // iPhone 6.7" — legacy (15 Pro Max). 1290 × 2796.
  { name: "iPhone_67", width: 430, height: 932, deviceScaleFactor: 3, isMobile: true },
  // iPhone 6.5" — legacy 2 (11 Pro Max). 1242 × 2688.
  { name: "iPhone_65", width: 414, height: 896, deviceScaleFactor: 3, isMobile: true },
  // iPad Pro 13" — current (M4). 2064 × 2752.
  { name: "iPad_Pro_13", width: 1032, height: 1376, deviceScaleFactor: 2, isMobile: false },
  // iPad Pro 12.9" — legacy. 2048 × 2732.
  { name: "iPad_Pro_129", width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: false },
];

// Each PAGE produces one screenshot per (device × locale). The route is
// the path under TARGET; the locale is appended as ?_locale=<code> so
// next-intl picks it up server-side.
const PAGES = [
  { name: "01-learn", path: "/learn", waitFor: '[data-coach="streak"]' },
  { name: "02-lesson", path: "/learn", waitFor: '[data-coach="streak"]' }, // TODO: deep link into a lesson
  { name: "03-leagues", path: "/leagues", waitFor: "h1" },
  { name: "04-shop", path: "/shop/outfits", waitFor: "h1" },
  { name: "05-pro", path: "/pro", waitFor: "h1" },
];

const LOCALES = [
  { code: "pt-BR", cookie: "pt-BR" },
  { code: "en-US", cookie: "en" },
  { code: "es-ES", cookie: "es" },
];

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error(
      "Playwright not installed. Run:  npm i -D playwright && npx playwright install chromium",
    );
    process.exit(1);
  }

  await mkdir(OUT_ROOT, { recursive: true });

  const browser = await chromium.launch();

  for (const device of DEVICES) {
    for (const locale of LOCALES) {
      const ctx = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.deviceScaleFactor,
        isMobile: device.isMobile,
        hasTouch: device.isMobile,
        userAgent: device.isMobile
          ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
          : "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
        locale: locale.code,
      });

      // Persist next-intl locale via cookie so SSR picks the right language.
      await ctx.addCookies([
        {
          name: "NEXT_LOCALE",
          value: locale.cookie,
          domain: new URL(TARGET).hostname,
          path: "/",
          httpOnly: false,
          secure: TARGET.startsWith("https"),
          sameSite: "Lax",
        },
      ]);

      const page = await ctx.newPage();

      // Login once so authed routes work.
      await page.goto(`${TARGET}/login`, { waitUntil: "domcontentloaded" });
      try {
        await page.fill('input[type="email"]', EMAIL, { timeout: 8000 });
        await page.fill('input[type="password"]', PASSWORD, { timeout: 8000 });
        await Promise.all([
          page.waitForURL((url) => !url.toString().includes("/login"), {
            timeout: 15000,
          }),
          page.click('button[type="submit"]'),
        ]);
      } catch (err) {
        console.warn(
          `[${device.name}/${locale.code}] login skipped (${err?.message ?? err}). Continuing — public pages still work.`,
        );
      }

      const deviceDir = join(OUT_ROOT, locale.code, device.name);
      await mkdir(deviceDir, { recursive: true });

      for (const p of PAGES) {
        try {
          await page.goto(`${TARGET}${p.path}`, { waitUntil: "networkidle" });
          if (p.waitFor) {
            await page
              .waitForSelector(p.waitFor, { timeout: 8000 })
              .catch(() => null);
          }
          // Give animations a beat to finish.
          await page.waitForTimeout(800);
          const file = join(deviceDir, `${p.name}.png`);
          await page.screenshot({ path: file, fullPage: false });
          console.log(`✓ ${locale.code}/${device.name}/${p.name}.png`);
        } catch (err) {
          console.warn(
            `✗ ${locale.code}/${device.name}/${p.name}: ${err?.message ?? err}`,
          );
        }
      }

      await ctx.close();
    }
  }

  await browser.close();

  // README to remind the human how to use these.
  const readmePath = join(OUT_ROOT, "README.md");
  if (!existsSync(readmePath)) {
    await writeFile(
      readmePath,
      [
        "# Screenshots — capturadas via headless Chromium",
        "",
        "Geradas por `scripts/screenshots.mjs` rodando contra a versão web do app.",
        "",
        "## Upload pra App Store Connect",
        "",
        "1. `bundle exec fastlane deliver --force --skip_binary_upload --skip_metadata`",
        "   (lê esta pasta automaticamente — ver `fastlane/Deliverfile`).",
        "2. OU: arraste manualmente cada PNG no App Store Connect → My App →",
        "   App Store tab → Previews and Screenshots.",
        "",
        "## Substituir por capturas iOS-nativas",
        "",
        "Pra v1.1+, rodar `bundle exec fastlane snapshot` em um Mac com Xcode",
        "(o `Snapfile` já está configurado).",
      ].join("\n"),
    );
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
