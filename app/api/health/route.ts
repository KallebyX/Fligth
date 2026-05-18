import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckStatus = "ok" | "fail";
type HealthResponse = {
  status: "ok" | "degraded";
  checks: Record<string, { status: CheckStatus; latencyMs?: number; error?: string }>;
  release: string | null;
  timestamp: string;
};

async function timed<T>(fn: () => Promise<T>): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await fn();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Probe DB + auth + storage. Returns 200 with status='ok' when all pass,
// or 503 with status='degraded' on any failure. Cheap enough to poll
// from uptime monitors at 1/minute. Does NOT include user-specific data
// in the response shape so we can serve it unauthenticated.
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const service = createServiceClient();

  // 1. DB connectivity — count from a tiny constant-cost table.
  const db = await timed(async () => {
    const { error } = await service.from("subjects").select("id", { head: true, count: "exact" }).limit(1);
    if (error) throw error;
  });

  // 2. Auth admin endpoint — list a single user (cheap, exists since signup).
  const auth = await timed(async () => {
    const { error } = await service.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
  });

  // 3. Storage — list the avatars bucket root.
  const storage = await timed(async () => {
    const { error } = await service.storage.from("avatars").list("", { limit: 1 });
    if (error) throw error;
  });

  const checks: HealthResponse["checks"] = {
    db: { status: db.ok ? "ok" : "fail", latencyMs: db.latencyMs, error: db.error },
    auth: { status: auth.ok ? "ok" : "fail", latencyMs: auth.latencyMs, error: auth.error },
    storage: { status: storage.ok ? "ok" : "fail", latencyMs: storage.latencyMs, error: storage.error },
  };

  const allOk = Object.values(checks).every((c) => c.status === "ok");
  const body: HealthResponse = {
    status: allOk ? "ok" : "degraded",
    checks,
    release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: allOk ? 200 : 503 });
}
