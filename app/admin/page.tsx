import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";

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

  if (profile?.role !== "admin") {
    return (
      <main className="container max-w-xl py-10">
        <Card>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDesc className="mt-2">
            Esta página é só para administradores. Se você é o dono da plataforma, atualize seu perfil
            no Supabase: <code>update profiles set role = &apos;admin&apos; where id = &apos;...&apos;;</code>
          </CardDesc>
        </Card>
      </main>
    );
  }

  const [{ count: subjectsCount }, { count: questionsCount }, { count: usersCount }] = await Promise.all([
    supabase.from("subjects").select("id", { count: "exact", head: true }),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  return (
    <main className="container max-w-3xl space-y-6 py-8">
      <h1 className="text-3xl font-black">Painel admin</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-ink/60">Matérias</p>
          <p className="text-2xl font-black">{subjectsCount ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-ink/60">Questões</p>
          <p className="text-2xl font-black">{questionsCount ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-ink/60">Usuários</p>
          <p className="text-2xl font-black">{usersCount ?? 0}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>Como cadastrar mais questões</CardTitle>
        <CardDesc className="mt-2">
          Edite os arquivos JSON em <code>content/questions/&lt;materia&gt;.json</code> e rode{" "}
          <code>npm run seed</code>. O importador é idempotente — questões já cadastradas são
          atualizadas pelo enunciado.
        </CardDesc>
      </Card>
    </main>
  );
}
