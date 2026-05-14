/* eslint-disable no-console */
import sharp from "sharp";
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const WEB_OUT = join(ROOT, "public/icons");
const IOS_OUT = join(ROOT, "ios/App/App/Assets.xcassets/AppIcon.appiconset");
mkdirSync(WEB_OUT, { recursive: true });
mkdirSync(IOS_OUT, { recursive: true });

// Inline Capitão Lorí SVG (matches components/mascot/Mascot.tsx visual identity).
function svgMascot({ size, bg = "#0EA5E9", maskable = false }) {
  const padding = maskable ? size * 0.18 : 0; // safe zone for maskable
  const inner = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const scale = inner / 120; // base viewBox is 120
  const tx = cx - 60 * scale;
  const ty = cy - 60 * scale;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <g transform="translate(${tx},${ty}) scale(${scale})">
    <ellipse cx="60" cy="72" rx="38" ry="34" fill="#10B981"/>
    <ellipse cx="60" cy="80" rx="22" ry="20" fill="#FDE68A"/>
    <circle cx="60" cy="42" r="28" fill="#10B981"/>
    <path d="M32 38 Q60 14 88 38 L86 46 Q60 34 34 46 Z" fill="#0F172A"/>
    <rect x="34" y="40" width="52" height="6" fill="#FBBF24"/>
    <circle cx="48" cy="42" r="8" fill="#0F172A"/>
    <circle cx="72" cy="42" r="8" fill="#0F172A"/>
    <circle cx="48" cy="42" r="6" fill="#A7F3D0" opacity="0.4"/>
    <circle cx="72" cy="42" r="6" fill="#A7F3D0" opacity="0.4"/>
    <circle cx="48" cy="42" r="2" fill="#0F172A"/>
    <circle cx="72" cy="42" r="2" fill="#0F172A"/>
    <path d="M54 56 L66 56 L60 64 Z" fill="#F97316"/>
    <path d="M22 70 Q12 80 24 96" stroke="#047857" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M98 70 Q108 80 96 96" stroke="#047857" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
}

// iOS app icons must be opaque (no alpha channel) per Apple guidelines.
async function renderPng(path, size, maskable) {
  const svg = svgMascot({ size, maskable });
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path);
}

// Full universal iOS AppIcon set: iPhone + iPad + ios-marketing.
// Filenames intentionally include the pixel size so they don't collide.
const IOS_ICONS = [
  // iPhone notification
  { size: 40, idiom: "iphone", spec: "20x20", scale: "2x" },
  { size: 60, idiom: "iphone", spec: "20x20", scale: "3x" },
  // iPhone settings
  { size: 58, idiom: "iphone", spec: "29x29", scale: "2x" },
  { size: 87, idiom: "iphone", spec: "29x29", scale: "3x" },
  // iPhone spotlight
  { size: 80, idiom: "iphone", spec: "40x40", scale: "2x" },
  { size: 120, idiom: "iphone", spec: "40x40", scale: "3x" },
  // iPhone app
  { size: 120, idiom: "iphone", spec: "60x60", scale: "2x" },
  { size: 180, idiom: "iphone", spec: "60x60", scale: "3x" },
  // iPad notification
  { size: 20, idiom: "ipad", spec: "20x20", scale: "1x" },
  { size: 40, idiom: "ipad", spec: "20x20", scale: "2x" },
  // iPad settings
  { size: 29, idiom: "ipad", spec: "29x29", scale: "1x" },
  { size: 58, idiom: "ipad", spec: "29x29", scale: "2x" },
  // iPad spotlight
  { size: 40, idiom: "ipad", spec: "40x40", scale: "1x" },
  { size: 80, idiom: "ipad", spec: "40x40", scale: "2x" },
  // iPad app
  { size: 76, idiom: "ipad", spec: "76x76", scale: "1x" },
  { size: 152, idiom: "ipad", spec: "76x76", scale: "2x" },
  // iPad Pro 12.9"
  { size: 167, idiom: "ipad", spec: "83.5x83.5", scale: "2x" },
  // App Store
  { size: 1024, idiom: "ios-marketing", spec: "1024x1024", scale: "1x" },
];

async function buildIos() {
  // Clean stale pngs to avoid orphan files. Keep Contents.json (we rewrite it below).
  for (const f of readdirSync(IOS_OUT)) {
    if (f.endsWith(".png")) unlinkSync(join(IOS_OUT, f));
  }

  // Render unique sizes once and reuse for entries sharing the same pixel size.
  const renderedBySize = new Map();
  for (const ic of IOS_ICONS) {
    if (!renderedBySize.has(ic.size)) {
      const path = join(IOS_OUT, `AppIcon-${ic.size}.png`);
      await renderPng(path, ic.size, false);
      renderedBySize.set(ic.size, `AppIcon-${ic.size}.png`);
      console.log(`✓ ios/AppIcon-${ic.size}.png`);
    }
  }

  const contents = {
    images: IOS_ICONS.map((ic) => ({
      size: ic.spec,
      idiom: ic.idiom,
      filename: renderedBySize.get(ic.size),
      scale: ic.scale,
    })),
    info: { version: 1, author: "xcode" },
  };
  writeFileSync(join(IOS_OUT, "Contents.json"), JSON.stringify(contents, null, 2));
  console.log("✓ ios/Contents.json");
}

async function buildWeb() {
  const targets = [
    { name: "icon-192.png", size: 192, maskable: false },
    { name: "icon-512.png", size: 512, maskable: false },
    { name: "icon-maskable-512.png", size: 512, maskable: true },
    { name: "apple-touch-icon.png", size: 180, maskable: false },
    { name: "favicon-32.png", size: 32, maskable: false },
    { name: "favicon-16.png", size: 16, maskable: false },
    { name: "android-launcher-432.png", size: 432, maskable: true },
    { name: "android-launcher-512.png", size: 512, maskable: true },
  ];
  for (const t of targets) {
    await renderPng(join(WEB_OUT, t.name), t.size, t.maskable);
    console.log(`✓ web/${t.name}`);
  }
  writeFileSync(join(WEB_OUT, "icon.svg"), svgMascot({ size: 512 }));
  console.log("✓ web/icon.svg");
}

async function main() {
  await buildWeb();
  await buildIos();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
