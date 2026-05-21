/**
 * NSFW gate for gallery uploads.
 *
 * Calls the Supabase Edge Function `safesearch` which proxies to Google
 * Cloud Vision SafeSearch. Returns a normalized score in [0, 1] (higher =
 * more likely NSFW) plus the dominant category.
 *
 * Graceful degradation: if the Vision API key isn't configured on the Edge
 * Function side, the function returns `{ score: null }` and we treat the
 * image as a pass — relying on the human moderation queue. This keeps the
 * upload flow working before the ops team has wired the API key.
 */

import { createClient } from "@/lib/supabase/server";

export type NSFWCheck = {
  ok: boolean;
  score: number | null;
  worstCategory: "adult" | "violence" | "racy" | null;
  blocked: boolean;
  error?: string;
};

/** Auto-block threshold. Tuned to catch obvious adult/violence with low FP. */
export const NSFW_BLOCK_THRESHOLD = 0.8;

export async function checkImageNSFW(imageUrl: string): Promise<NSFWCheck> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.functions.invoke("safesearch", {
      body: { imageUrl },
    });
    if (error) {
      return {
        ok: false,
        score: null,
        worstCategory: null,
        blocked: false,
        error: error.message,
      };
    }
    const score = typeof data?.score === "number" ? data.score : null;
    const worstCategory = data?.worstCategory ?? null;
    const blocked = score !== null && score >= NSFW_BLOCK_THRESHOLD;
    return { ok: true, score, worstCategory, blocked };
  } catch (err) {
    return {
      ok: false,
      score: null,
      worstCategory: null,
      blocked: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
