import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, MapPin } from "lucide-react";
import { HUD } from "@/components/hud/HUD";
import { AppShell } from "@/components/nav/AppShell";
import { SchoolFilters } from "@/components/schools/SchoolFilters";
import { Mascot } from "@/components/mascot/Mascot";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { computeHearts } from "@/lib/hearts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Escolas de aviação",
  description:
    "Diretório de escolas de aviação no Brasil. Encontre uma próxima da sua cidade e fale direto com elas.",
  alternates: { canonical: "/escolas" },
};

type Search = { uf?: string; q?: string };

// Public listing — crawlers and visitors WITHOUT auth must see the school
// cards. Sitemap.xml advertises this URL and /escolas/[slug] for SEO; if
// we auth-walled them, the bot would index /login instead. The HUD only
// renders for authenticated users.
export default async function SchoolsPage(props: {
  searchParams: Promise<Search>;
}) {
  const sp = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Stats query is per-user — skip cleanly when anonymous.
  const stats = user
    ? (
        await supabase
          .from("user_stats")
          .select("total_xp, current_streak, hearts, hearts_regen_at, gems")
          .eq("user_id", user.id)
          .single()
      ).data
    : null;

  // Use service-role for the public schools read so crawlers (which have
  // no JWT) can still see the rows even if anon RLS tightens later.
  const service = createServiceClient();
  let q = service
    .from("schools")
    .select(
      "id, slug, name, city, state, logo_url, cover_url, description, featured, cursos",
    )
    .eq("status", "active")
    .order("featured", { ascending: false })
    .order("city", { ascending: true })
    .limit(80);

  if (sp.uf) q = q.eq("state", sp.uf.toUpperCase());
  if (sp.q) q = q.ilike("name", `%${sp.q}%`);

  const { data: schools } = await q;

  const { data: allUfs } = await service
    .from("schools")
    .select("state")
    .eq("status", "active");
  const ufList = Array.from(new Set((allUfs ?? []).map((r) => r.state))).sort();

  const refreshed = stats
    ? computeHearts({ hearts: stats.hearts, hearts_regen_at: stats.hearts_regen_at })
    : { hearts: 5, hearts_regen_at: null, changed: false };

  return (
    <AppShell>
      {user && (
        <HUD
          xp={stats?.total_xp ?? 0}
          streak={stats?.current_streak ?? 0}
          hearts={refreshed.hearts}
          gems={stats?.gems ?? 0}
        />
      )}

      <PullToRefresh className="relative">
      <main className="container max-w-3xl space-y-6 py-6">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink dark:text-cloud/60 dark:hover:text-cloud"
        >
          <ChevronLeft size={16} />
          Voltar
        </Link>

        <header>
          <h1 className="text-3xl font-black dark:text-cloud">Escolas de aviação</h1>
          <p className="text-sm text-ink/60 dark:text-cloud/60">
            Encontre uma escola próxima e fale direto com elas. Pesquisa por
            estado, cidade ou curso.
          </p>
        </header>

        <SchoolFilters
          ufs={ufList}
          currentUf={sp.uf ?? null}
          currentQ={sp.q ?? null}
        />

        {!schools || schools.length === 0 ? (
          <div className="card-soft flex flex-col items-center gap-4 p-10 text-center">
            <Mascot state="confused" size={120} />
            <div>
              <h2 className="text-lg font-black">Nenhuma escola encontrada</h2>
              <p className="mt-1 text-sm text-ink/60">
                Ajuste o filtro ou volte mais tarde — novas escolas chegam toda
                semana.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {schools.map((s) => {
              const cursos = Array.isArray(s.cursos)
                ? (s.cursos as Array<{ slug?: string; nome?: string }>).slice(0, 3)
                : [];
              return (
                <li key={s.id}>
                  <Link
                    href={`/escolas/${s.slug}`}
                    className="block rounded-3xl border-2 border-cloud-deep bg-white p-4 hover:border-sky hover:bg-cloud/30"
                  >
                    <div className="flex items-start gap-3">
                      {s.logo_url ? (
                        <Image
                          src={s.logo_url}
                          alt={s.name}
                          width={56}
                          height={56}
                          className="h-14 w-14 shrink-0 rounded-xl bg-cloud object-cover ring-1 ring-cloud-deep/40"
                        />
                      ) : (
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky/15 text-2xl font-black text-sky-deep">
                          {s.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-black">
                            {s.name}
                          </h3>
                          {s.featured && (
                            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-gold">
                              Em destaque
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink/60">
                          <MapPin size={11} />
                          {s.city} · {s.state}
                        </p>
                        {s.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-ink/75">
                            {s.description}
                          </p>
                        )}
                        {cursos.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {cursos.map((c, i) => (
                              <span
                                key={i}
                                className="rounded-full bg-cloud px-2 py-0.5 text-[11px] font-bold text-ink/70"
                              >
                                {c.nome ?? c.slug}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      </PullToRefresh>
    </AppShell>
  );
}
