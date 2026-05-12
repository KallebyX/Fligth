// Outfit overlays for Capitão Lorí. Coordinates are in the 120×140 viewBox
// shared with Mascot.tsx. Head center: (60, 50), r=34. Body center: (60, 98).
// Overlays are intentionally painted ABOVE the base face, so they style the
// hair/cap/scarf area without ever covering the eyes or beak.

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
  return (
    <g>
      {/* Cap on top of the head */}
      <path
        d="M30 36 Q60 12 90 36 L88 42 Q60 30 32 42 Z"
        fill="#0F172A"
      />
      <rect x="32" y="38" width="56" height="6" fill="#FBBF24" />
      {/* Goggle straps */}
      <path
        d="M30 38 Q60 50 90 38"
        stroke="#1E293B"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
    </g>
  );
}

function SunsetShades() {
  return (
    <g>
      {/* Cap */}
      <path d="M30 36 Q60 12 90 36 L88 42 Q60 30 32 42 Z" fill="#7C2D12" />
      <rect x="32" y="38" width="56" height="6" fill="#F97316" />
      {/* Aviator shades sitting just below the cap */}
      <rect x="36" y="42" width="48" height="2" fill="#9A3412" />
      <ellipse cx="48" cy="48" rx="9" ry="6" fill="#9A3412" />
      <ellipse cx="72" cy="48" rx="9" ry="6" fill="#9A3412" />
      <ellipse cx="48" cy="48" rx="7" ry="4.5" fill="#F97316" />
      <ellipse cx="72" cy="48" rx="7" ry="4.5" fill="#F97316" />
      <path d="M57 48 L63 48" stroke="#9A3412" strokeWidth="2" />
      {/* Highlights */}
      <ellipse cx="46" cy="46" rx="2.5" ry="1.5" fill="#FFEDD5" opacity="0.7" />
      <ellipse cx="70" cy="46" rx="2.5" ry="1.5" fill="#FFEDD5" opacity="0.7" />
    </g>
  );
}

function NeonScarf() {
  return (
    <g>
      {/* Cap */}
      <path d="M30 36 Q60 12 90 36 L88 42 Q60 30 32 42 Z" fill="#0F172A" />
      <rect x="32" y="38" width="56" height="6" fill="#22D3EE" />
      {/* Scarf wrapped around the neck */}
      <path
        d="M34 84 Q60 96 86 84 L88 90 Q60 102 32 90 Z"
        fill="#22D3EE"
        stroke="#0E7490"
        strokeWidth="1.5"
      />
      <path
        d="M82 90 L94 108 L88 110 L80 96 Z"
        fill="#22D3EE"
        stroke="#0E7490"
        strokeWidth="1.5"
      />
    </g>
  );
}

function Thunderbolt() {
  return (
    <g>
      {/* Cap */}
      <path d="M30 36 Q60 12 90 36 L88 42 Q60 30 32 42 Z" fill="#0F172A" />
      <rect x="32" y="38" width="56" height="6" fill="#FACC15" />
      {/* Lightning patch on the belly */}
      <path
        d="M58 94 L70 94 L62 106 L74 106 L52 124 L60 110 L48 110 Z"
        fill="#FACC15"
        stroke="#A16207"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </g>
  );
}

function AzureHelmet() {
  return (
    <g>
      {/* Sapphire helmet wraps the top of the head */}
      <path
        d="M26 42 Q60 4 94 42 L92 50 Q60 30 28 50 Z"
        fill="#0369A1"
        stroke="#082F49"
        strokeWidth="1.5"
      />
      <rect x="30" y="44" width="60" height="6" fill="#38BDF8" />
      <circle cx="60" cy="20" r="4" fill="#FBBF24" />
    </g>
  );
}

function RedBaron() {
  return (
    <g>
      {/* Helmet */}
      <path d="M26 42 Q60 6 94 42 L92 50 Q60 30 28 50 Z" fill="#7F1D1D" stroke="#450A0A" strokeWidth="1.5" />
      <rect x="30" y="44" width="60" height="6" fill="#FCA5A5" />
      {/* Scarf */}
      <path d="M34 84 Q60 96 86 84 L88 92 Q60 104 32 92 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5" />
      <path d="M28 92 L20 116 L28 116 L34 98 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5" />
    </g>
  );
}

function DiamanteJacket() {
  return (
    <g>
      {/* Cap */}
      <path d="M30 36 Q60 12 90 36 L88 42 Q60 30 32 42 Z" fill="#164E63" />
      <rect x="32" y="38" width="56" height="6" fill="#67E8F9" />
      {/* Crystal vest */}
      <path
        d="M40 94 L46 112 L60 102 L74 112 L80 94 L60 116 Z"
        fill="#A5F3FC"
        stroke="#0E7490"
        strokeWidth="1.2"
      />
      <circle cx="48" cy="98" r="1.6" fill="#fff" />
      <circle cx="72" cy="108" r="1.6" fill="#fff" />
      <circle cx="60" cy="120" r="1.2" fill="#fff" />
    </g>
  );
}

function ProGold() {
  return (
    <g>
      {/* Gold helmet */}
      <path d="M26 42 Q60 8 94 42 L92 50 Q60 30 28 50 Z" fill="#92400E" stroke="#451A03" strokeWidth="1.5" />
      <rect x="30" y="44" width="60" height="6" fill="#FBBF24" />
      <circle cx="60" cy="20" r="4.5" fill="#FDE68A" />
      {/* Gold sash */}
      <path d="M34 94 L86 94 L84 102 L36 102 Z" fill="#FBBF24" stroke="#92400E" strokeWidth="1.5" />
      <circle cx="60" cy="98" r="3" fill="#FDE68A" stroke="#92400E" strokeWidth="1" />
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
