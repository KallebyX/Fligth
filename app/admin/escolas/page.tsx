import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Building2, Plus, ExternalLink } from "lucide-react";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_TINT: Record<string, string> = {
  active:    "bg-grass/15 text-grass-deep",
  suspended: "bg-sun/15 text-sun",
  inactive:  "bg-cloud-deep/30 text-ink/55 dark:bg-ink-light/30 dark:text-cloud/55",
};

export default async function AdminSchoolsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/admin");

  const [{ data: schools }, { count: leadCount }] = await Promise.all([
    supabase
      .from("schools")
      .select("id, slug, name, city, state, status, featured, created_at")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.from("school_leads").select("id", { count: "exact", head: true }),
  ]);

  return (
    <main className="container max-w-3xl space-y-6 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink dark:text-cloud/60 dark:hover:text-cloud"
      >
        <ChevronLeft size={16} />
        Voltar ao admin
      </Link>

      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black">
            <Building2 size={26} className="text-sky" />
            Escolas
          </h1>
          <p className="text-sm text-ink/60 dark:text-cloud/60">
            {schools?.length ?? 0} escolas cadastradas · {leadCount ?? 0} leads
            recebidos
          </p>
        </div>
        <Link href="/admin/escolas/novo">
          <Button>
            <Plus size={14} />
            Nova escola
          </Button>
        </Link>
      </header>

      {!schools || schools.length === 0 ? (
        <Card className="text-center">
          <CardTitle>Nenhuma escola cadastrada</CardTitle>
          <CardDesc className="mt-2">
            Comece adicionando a primeira escola pelo botão acima.
          </CardDesc>
        </Card>
      ) : (
        <ul className="space-y-2">
          {schools.map((s) => (
            <li key={s.id}>
              <div className="card-pop flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-black">{s.name}</h3>
                    {s.featured && (
                      <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-gold">
                        Destaque
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink/60 dark:text-cloud/60">
                    {s.city} · {s.state} ·{" "}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-extrabold uppercase",
                        STATUS_TINT[s.status] ?? STATUS_TINT.inactive,
                      )}
                    >
                      {s.status}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Link
                    href={`/escolas/${s.slug}`}
                    target="_blank"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-cloud-deep/15 hover:text-ink dark:text-cloud/50 dark:hover:bg-ink-light/30 dark:hover:text-cloud"
                    aria-label="Ver página pública"
                  >
                    <ExternalLink size={14} />
                  </Link>
                  <Link href={`/admin/escolas/${s.id}`}>
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
