// Calculates how "complete" a profile is. Used to drive the meter in
// /profile/edit and to award a one-time gem bonus when the user hits 100%.

export type ProfileCompletionInput = {
  username: string | null;
  display_name: string | null;
  bio: string | null;
  country_code: string | null;
  avatar_url: string | null;
  equipped_outfit_slug: string | null;
};

export type ProfileCompletionResult = {
  pct: number;
  filled: string[];
  missing: { key: string; label: string }[];
};

// Field weights sum to 100. The username carries the most weight since it's
// the only required field; the rest are signals of investment.
const FIELDS = [
  { key: "username", label: "Definir @ único", weight: 25 },
  { key: "display_name", label: "Adicionar nome de exibição", weight: 15 },
  { key: "avatar_url", label: "Adicionar foto de perfil", weight: 20 },
  { key: "bio", label: "Escrever uma bio curta", weight: 15 },
  { key: "country_code", label: "Escolher seu país", weight: 15 },
  { key: "equipped_outfit_slug", label: "Equipar um outfit do mascote", weight: 10 },
] as const;

export function calculateCompletion(
  profile: ProfileCompletionInput,
): ProfileCompletionResult {
  let pct = 0;
  const filled: string[] = [];
  const missing: { key: string; label: string }[] = [];

  for (const field of FIELDS) {
    const value = profile[field.key as keyof ProfileCompletionInput];
    const isFilled =
      typeof value === "string" && value.trim().length > 0;
    if (isFilled) {
      pct += field.weight;
      filled.push(field.key);
    } else {
      missing.push({ key: field.key, label: field.label });
    }
  }

  return { pct, filled, missing };
}
