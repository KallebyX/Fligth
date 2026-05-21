import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SchoolUpsertForm } from "@/components/schools/SchoolUpsertForm";
import type { CursoInput } from "@/app/actions/adminSchools";

export const dynamic = "force-dynamic";

export default async function EditSchoolPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
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

  const { data: school } = await supabase
    .from("schools")
    .select(
      "id, slug, name, legal_name, description, logo_url, cover_url, city, state, address, phone, email, website, instagram, whatsapp, cursos, anac_codigo, featured",
    )
    .eq("id", id)
    .maybeSingle();

  if (!school) notFound();

  const cursos = Array.isArray(school.cursos)
    ? (school.cursos as CursoInput[])
    : [];

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
        <h1 className="text-3xl font-black">Editar escola</h1>
        <p className="text-sm text-ink/60">{school.name}</p>
      </header>

      <SchoolUpsertForm
        initial={{
          id: school.id,
          slug: school.slug,
          name: school.name,
          legal_name: school.legal_name ?? undefined,
          description: school.description ?? undefined,
          logo_url: school.logo_url ?? undefined,
          cover_url: school.cover_url ?? undefined,
          city: school.city,
          state: school.state,
          address: school.address ?? undefined,
          phone: school.phone ?? undefined,
          email: school.email,
          website: school.website ?? undefined,
          instagram: school.instagram ?? undefined,
          whatsapp: school.whatsapp ?? undefined,
          cursos,
          anac_codigo: school.anac_codigo ?? undefined,
          featured: school.featured,
        }}
      />
    </main>
  );
}
