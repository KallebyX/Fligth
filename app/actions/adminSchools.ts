"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CursoInput = {
  slug?: string;
  nome: string;
  preco_brl?: number;
  duracao_meses?: number;
};

export type SchoolUpsertInput = {
  id?: string;          // present = update
  slug: string;
  name: string;
  legal_name?: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
  city: string;
  state: string;
  address?: string;
  phone?: string;
  email: string;
  website?: string;
  instagram?: string;
  whatsapp?: string;
  cursos?: CursoInput[];
  anac_codigo?: string;
  featured?: boolean;
};

export type UpsertResult =
  | { ok: true; schoolId: string }
  | { ok: false; error: string };

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,80}[a-z0-9])?$/;
const UF_RE = /^[A-Z]{2}$/;

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { ok: false, error: "forbidden" };
  return { ok: true };
}

export async function upsertSchool(input: SchoolUpsertInput): Promise<UpsertResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  if (!SLUG_RE.test(input.slug)) {
    return { ok: false, error: "slug_invalid" };
  }
  if (!UF_RE.test(input.state)) {
    return { ok: false, error: "state_invalid" };
  }
  if (!input.email.includes("@")) {
    return { ok: false, error: "email_invalid" };
  }

  const supabase = await createClient();
  const row = {
    slug: input.slug.trim().toLowerCase(),
    name: input.name.trim(),
    legal_name: input.legal_name?.trim() || null,
    description: input.description?.trim() || null,
    logo_url: input.logo_url?.trim() || null,
    cover_url: input.cover_url?.trim() || null,
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    address: input.address?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email.trim().toLowerCase(),
    website: input.website?.trim() || null,
    instagram: input.instagram?.replace(/^@/, "").trim() || null,
    whatsapp: input.whatsapp?.trim() || null,
    cursos: (input.cursos ?? []).filter((c) => c.nome?.trim()),
    anac_codigo: input.anac_codigo?.trim() || null,
    featured: !!input.featured,
  };

  if (input.id) {
    const { error } = await supabase
      .from("schools")
      .update(row)
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/escolas/${row.slug}`);
    revalidatePath("/escolas");
    revalidatePath("/admin/escolas");
    return { ok: true, schoolId: input.id };
  }

  const { data, error } = await supabase
    .from("schools")
    .insert(row)
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }
  revalidatePath("/escolas");
  revalidatePath("/admin/escolas");
  return { ok: true, schoolId: data.id };
}

export async function setSchoolStatus(
  id: string,
  status: "active" | "suspended" | "inactive",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const supabase = await createClient();
  const { error } = await supabase.from("schools").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/escolas");
  revalidatePath("/escolas");
  return { ok: true };
}
