import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  Camera,
  HelpCircle,
  Layers,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
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

  // Match sub-admin routes (/admin/escolas, /admin/gallery/queue): redirect
  // non-admins back to /learn rather than rendering an inline "Acesso
  // restrito" card. Consistent UX + one fewer attack surface (no info leak
  // about admin path existing).
  if (profile?.role !== "admin") {
    redirect("/learn");
  }

  const [
    { count: subjectsCount },
    { count: unitsCount },
    { count: lessonsCount },
    { count: questionsCount },
    { count: usersCount },
    { count: leagueMembers },
  ] = await Promise.all([
    supabase.from("subjects").select("id", { count: "exact", head: true }),
    supabase.from("units").select("id", { count: "exact", head: true }),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("league_members").select("user_id", { count: "exact", head: true }),
  ]);

  return (
    <main className="container max-w-3xl space-y-6 py-8">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-black">
          <Sparkles size={28} className="text-sky" />
          Painel admin
        </h1>
        <p className="text-sm text-ink/60">
          Métricas de conteúdo e usuários em tempo real.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<Layers size={18} />} tint="bg-sky/15 text-sky-deep" label="Matérias" value={subjectsCount} />
        <Stat icon={<BookOpen size={18} />} tint="bg-grass/15 text-grass-deep" label="Unidades" value={unitsCount} />
        <Stat icon={<HelpCircle size={18} />} tint="bg-sun/15 text-sun" label="Lições" value={lessonsCount} />
        <Stat icon={<HelpCircle size={18} />} tint="bg-gold/20 text-gold" label="Questões" value={questionsCount} />
        <Stat icon={<Users size={18} />} tint="bg-alert/15 text-alert" label="Usuários" value={usersCount} />
        <Stat icon={<Trophy size={18} />} tint="bg-ink/10 text-ink" label="Em liga" value={leagueMembers} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/gallery/queue"
          className="card-pop flex items-center gap-3 p-4 hover:bg-cloud/40"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky/15 text-sky-deep">
            <Camera size={20} />
          </span>
          <div className="flex-1">
            <p className="font-black">Moderar galeria</p>
            <p className="text-xs text-ink/60">Aprovar ou rejeitar fotos pendentes</p>
          </div>
        </Link>
        <Link
          href="/admin/escolas"
          className="card-pop flex items-center gap-3 p-4 hover:bg-cloud/40"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-grass/15 text-grass-deep">
            <Building2 size={20} />
          </span>
          <div className="flex-1">
            <p className="font-black">Escolas</p>
            <p className="text-xs text-ink/60">Cadastrar e editar escolas afiliadas</p>
          </div>
        </Link>
      </section>

      <Card>
        <CardTitle>Cadastrar mais questões</CardTitle>
        <CardDesc className="mt-2">
          Edite os arquivos JSON em{" "}
          <code className="rounded bg-cloud px-1.5 py-0.5 text-xs">
            content/questions/&lt;materia&gt;.json
          </code>{" "}
          e rode <code className="rounded bg-cloud px-1.5 py-0.5 text-xs">npm run seed</code>.
          O importador é idempotente — questões já cadastradas são atualizadas
          pelo enunciado.
        </CardDesc>
      </Card>

      <Card>
        <CardTitle>Disparar promoção de liga</CardTitle>
        <CardDesc className="mt-2">
          Cron roda toda <strong>segunda 03:00 UTC</strong>. Para forçar
          manualmente:
        </CardDesc>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-cloud px-3 py-2 text-xs">
          <code>{`POST /api/cron/leagues
Authorization: Bearer $CRON_SECRET`}</code>
        </pre>
      </Card>
    </main>
  );
}

function Stat({
  icon,
  tint,
  label,
  value,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  value: number | null;
}) {
  return (
    <div className="card-pop flex flex-col items-start gap-1.5 p-3">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tint}`}>
        {icon}
      </span>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
        {label}
      </p>
      <p className="text-lg font-black tabular-nums">{value ?? 0}</p>
    </div>
  );
}
