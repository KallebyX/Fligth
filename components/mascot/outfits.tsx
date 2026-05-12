// Outfit overlays for the Capitão Lorí mascot. Each export is a pure SVG
// fragment positioned in the mascot's 120×120 viewBox. They render INSIDE
// the Mascot <svg> after the base body, so they paint on top of the
// default cap/goggles where needed.

export type OutfitSlug =
  | "aviator-classic"
  | "sunset-shades"
  | "neon-scarf"
  | "thunderbolt"
  | "azure-helmet"
  | "red-baron"
  | "diamante-jacket"
  | "pro-gold";

function AviatorClassic() {
  // Base mascot already draws the classic cap; nothing to overlay.
  return null;
}

function SunsetShades() {
  // Repaint the goggles in mirrored orange shades.
  return (
    <g>
      <ellipse cx="48" cy="42" rx="9" ry="7" fill="#7C2D12" />
      <ellipse cx="72" cy="42" rx="9" ry="7" fill="#7C2D12" />
      <ellipse cx="48" cy="42" rx="7.5" ry="5.5" fill="#F97316" />
      <ellipse cx="72" cy="42" rx="7.5" ry="5.5" fill="#F97316" />
      <ellipse cx="46" cy="40" rx="2.5" ry="1.5" fill="#FFEDD5" opacity="0.75" />
      <ellipse cx="70" cy="40" rx="2.5" ry="1.5" fill="#FFEDD5" opacity="0.75" />
      <path d="M57 42 L63 42" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function NeonScarf() {
  return (
    <g>
      <path d="M36 64 Q60 76 84 64 L86 70 Q60 82 34 70 Z" fill="#22D3EE" stroke="#0E7490" strokeWidth="1.5" />
      <path d="M82 70 L94 88 L88 90 L80 76 Z" fill="#22D3EE" stroke="#0E7490" strokeWidth="1.5" />
    </g>
  );
}

function Thunderbolt() {
  return (
    <g>
      <path
        d="M58 76 L70 76 L62 88 L74 88 L52 108 L60 92 L48 92 Z"
        fill="#FACC15"
        stroke="#A16207"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </g>
  );
}

function AzureHelmet() {
  // Cover the classic cap with a sapphire helmet.
  return (
    <g>
      <path
        d="M28 44 Q60 6 92 44 L88 50 Q60 30 32 50 Z"
        fill="#0369A1"
        stroke="#082F49"
        strokeWidth="1.5"
      />
      <rect x="32" y="44" width="56" height="6" fill="#38BDF8" />
      <circle cx="60" cy="24" r="3" fill="#FBBF24" />
    </g>
  );
}

function RedBaron() {
  return (
    <g>
      {/* Helmet base */}
      <path d="M28 44 Q60 10 92 44 L88 50 Q60 32 32 50 Z" fill="#7F1D1D" stroke="#450A0A" strokeWidth="1.5" />
      <rect x="32" y="44" width="56" height="6" fill="#FCA5A5" />
      {/* Scarf */}
      <path d="M36 64 Q60 76 84 64 L86 72 Q60 84 34 72 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5" />
      <path d="M28 72 L20 96 L28 96 L34 78 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5" />
    </g>
  );
}

function DiamanteJacket() {
  return (
    <g>
      {/* Crystal jacket body */}
      <ellipse cx="60" cy="80" rx="26" ry="22" fill="#67E8F9" opacity="0.9" />
      <path
        d="M40 70 L46 88 L60 78 L74 88 L80 70 L60 92 Z"
        fill="#A5F3FC"
        stroke="#0E7490"
        strokeWidth="1.2"
      />
      {/* Sparkles */}
      <circle cx="48" cy="74" r="1.6" fill="#fff" />
      <circle cx="72" cy="84" r="1.6" fill="#fff" />
      <circle cx="60" cy="98" r="1.2" fill="#fff" />
    </g>
  );
}

function ProGold() {
  return (
    <g>
      {/* Gold helmet replaces the classic cap */}
      <path d="M28 44 Q60 8 92 44 L88 50 Q60 30 32 50 Z" fill="#92400E" stroke="#451A03" strokeWidth="1.5" />
      <rect x="32" y="44" width="56" height="6" fill="#FBBF24" />
      <circle cx="60" cy="24" r="4" fill="#FDE68A" />
      {/* Gold sash */}
      <path d="M34 70 L86 70 L84 78 L36 78 Z" fill="#FBBF24" stroke="#92400E" strokeWidth="1.5" />
      <circle cx="60" cy="74" r="3" fill="#FDE68A" stroke="#92400E" strokeWidth="1" />
    </g>
  );
}

const REGISTRY: Record<OutfitSlug, () => React.ReactElement | null> = {
  "aviator-classic": AviatorClassic,
  "sunset-shades": SunsetShades,
  "neon-scarf": NeonScarf,
  "thunderbolt": Thunderbolt,
  "azure-helmet": AzureHelmet,
  "red-baron": RedBaron,
  "diamante-jacket": DiamanteJacket,
  "pro-gold": ProGold,
};

export function MascotOutfit({ slug }: { slug?: string | null }) {
  if (!slug) return null;
  const Comp = REGISTRY[slug as OutfitSlug];
  if (!Comp) return null;
  return <Comp />;
}

export const OUTFIT_SLUGS = Object.keys(REGISTRY) as OutfitSlug[];
