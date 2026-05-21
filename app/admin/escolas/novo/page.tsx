import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SchoolUpsertForm } from "@/components/schools/SchoolUpsertForm";

export const dynamic = "force-dynamic";

export default async function NewSchoolPage() {
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

  return (
    <main className="container max-w-2xl space-y-6 py-8">
      <Link
        href="/admin/escolas"
        className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
      >
        <ChevronLeft size={16} />
        Voltar
      </Link>

      <header>
        <h1 className="text-3xl font-black">Nova escola</h1>
        <p className="text-sm text-ink/60">
          A escola fica ativa imediatamente após o cadastro. Verifique se você
          tem permissão da escola pra listá-la antes de salvar.
        </p>
      </header>

      <SchoolUpsertForm />
    </main>
  );
}
