// Constants that need to be importable from both server and client code.
// Keeping them away from the server-only modules (which use next/headers)
// avoids accidental client bundles of the service-role helpers.

export const ROULETTE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const ROULETTE_DUPLICATE_GEMS = 20;

export const JACKPOT_COST_GEMS = 50;
export const JACKPOT_COOLDOWN_MS = 60 * 60 * 1000;
export const JACKPOT_DUPLICATE_GEMS = 25;
