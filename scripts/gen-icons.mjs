/* eslint-disable no-console */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public/icons");
mkdirSync(OUT, { recursive: true });

// Inline Capitão Lorí SVG (matches components/mascot/Mascot.tsx visual identity).
function svgMascot({ size, bg = "#0EA5E9", maskable = false }) {
  const padding = maskable ? size * 0.18 : 0; // safe zone for maskable
  const inner = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2 + (maskable ? 0 : 0);
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

async function build() {
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
    const svg = svgMascot({ size: t.size, maskable: t.maskable });
    await sharp(Buffer.from(svg)).png().toFile(join(OUT, t.name));
    console.log(`✓ ${t.name}`);
  }

  // Also write a master SVG for any other use.
  writeFileSync(join(OUT, "icon.svg"), svgMascot({ size: 512 }));
  console.log("✓ icon.svg");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
