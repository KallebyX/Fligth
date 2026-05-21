// Supabase Edge Function: safesearch
//
// Receives a public image URL, runs it through Google Cloud Vision SafeSearch
// detection, and returns a normalized NSFW score (0–1) plus the per-category
// likelihoods. Used by createGalleryPost to gate user uploads server-side
// before they reach the human moderation queue.
//
// Auth: callers must present `Authorization: Bearer <SUPABASE_ANON_KEY>` —
// the function is invoked via supabase.functions.invoke from a server action,
// which automatically attaches the anon JWT. We do not enforce row-level
// auth here; the server action has already validated the user.
//
// Secrets (Supabase Dashboard → Edge Functions → safesearch → Secrets):
//   GOOGLE_VISION_API_KEY  — REST API key with Cloud Vision API enabled.
//
// Deploy:
//   supabase functions deploy safesearch --project-ref ggveduxfkljidzkrmmoo
//
// Test:
//   curl -X POST "$SUPABASE_URL/functions/v1/safesearch" \
//     -H "Authorization: Bearer $ANON_KEY" \
//     -H "Content-Type: application/json" \
//     -d '{"imageUrl": "https://.../photo.jpg"}'

interface RequestBody {
  imageUrl?: string;
}

interface VisionLikelihood {
  // Google Vision returns these strings; we map to numeric.
  adult: string;
  spoof: string;
  medical: string;
  violence: string;
  racy: string;
}

interface VisionResponse {
  responses: Array<{
    safeSearchAnnotation?: VisionLikelihood;
    error?: { code: number; message: string };
  }>;
}

// Google's 5-level scale → 0–1 score.
const LIKELIHOOD_SCORE: Record<string, number> = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 0,
  UNLIKELY: 0.25,
  POSSIBLE: 0.5,
  LIKELY: 0.8,
  VERY_LIKELY: 1,
};

function scoreFromVision(v: VisionLikelihood | undefined): {
  score: number;
  worstCategory: keyof VisionLikelihood | null;
} {
  if (!v) return { score: 0, worstCategory: null };
  // Compose score = max of adult, violence, racy (medical/spoof are not NSFW).
  const cats: Array<keyof VisionLikelihood> = ["adult", "violence", "racy"];
  let max = 0;
  let worst: keyof VisionLikelihood | null = null;
  for (const c of cats) {
    const s = LIKELIHOOD_SCORE[v[c]] ?? 0;
    if (s > max) {
      max = s;
      worst = c;
    }
  }
  return { score: max, worstCategory: worst };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const apiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
  if (!apiKey) {
    // No key configured → return neutral score so uploads aren't blocked
    // on infra gaps. The fallback is the human moderation queue.
    return json({ score: null, reason: "vision_not_configured" }, 200);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const imageUrl = body.imageUrl;
  if (!imageUrl || typeof imageUrl !== "string") {
    return json({ error: "imageUrl_required" }, 400);
  }
  // Defense: only allow http(s) URLs.
  if (!/^https?:\/\//.test(imageUrl)) {
    return json({ error: "invalid_url_scheme" }, 400);
  }

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  const visionReq = {
    requests: [
      {
        image: { source: { imageUri: imageUrl } },
        features: [{ type: "SAFE_SEARCH_DETECTION" }],
      },
    ],
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(visionReq),
    });
  } catch (err) {
    return json({ error: "vision_fetch_failed", detail: String(err) }, 502);
  }
  if (!res.ok) {
    return json({ error: "vision_http_error", status: res.status }, 502);
  }
  const data = (await res.json()) as VisionResponse;
  const r = data.responses?.[0];
  if (r?.error) {
    return json({ error: "vision_api_error", detail: r.error.message }, 502);
  }
  const { score, worstCategory } = scoreFromVision(r?.safeSearchAnnotation);
  return json({
    score,
    worstCategory,
    raw: r?.safeSearchAnnotation ?? null,
  });
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
}
