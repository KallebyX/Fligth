import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { HUD } from "@/components/hud/HUD";
import { AppShell } from "@/components/nav/AppShell";
import { LeadForm } from "@/components/schools/LeadForm";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { computeHearts } from "@/lib/hearts";

export const dynamic = "force-dynamic";

// SEO: school pages are public-facing landing pages. The service-role client
// lets us populate Open Graph without leaking auth state.
export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const service = createServiceClient();
  const { data } = await service
    .from("schools")
    .select("name, description, city, state, cover_url, logo_url")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!data) return { title: "Escola não encontrada" };

  const title = `${data.name} — ${data.city}/${data.state}`;
  const description =
    data.description?.slice(0, 200) ??
    `Conheça a ${data.name} em ${data.city}/${data.state}. Cursos PP-A e PC-A.`;
  const image = data.cover_url ?? data.logo_url ?? "/og.png";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/escolas/${slug}`,
      images: [{ url: image, alt: data.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: { canonical: `/escolas/${slug}` },
  };
}

export default async function SchoolDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: school }, { data: stats }] = await Promise.all([
    supabase
      .from("schools")
      .select(
        "id, slug, name, legal_name, description, logo_url, cover_url, city, state, address, phone, email, website, instagram, whatsapp, cursos, anac_codigo, featured",
      )
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("user_stats")
      .select("total_xp, current_streak, hearts, hearts_regen_at, gems")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!school) notFound();

  const refreshed = stats
    ? computeHearts({ hearts: stats.hearts, hearts_regen_at: stats.hearts_regen_at })
    : { hearts: 5, hearts_regen_at: null, changed: false };

  const cursos = Array.isArray(school.cursos)
    ? (school.cursos as Array<{
        slug?: string;
        nome?: string;
        preco_brl?: number;
        duracao_meses?: number;
      }>)
    : [];

  return (
    <AppShell>
      <HUD
        xp={stats?.total_xp ?? 0}
        streak={stats?.current_streak ?? 0}
        hearts={refreshed.hearts}
        gems={stats?.gems ?? 0}
      />

      <main className="container max-w-2xl space-y-6 py-6">
        <Link
          href="/escolas"
          className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
        >
          <ChevronLeft size={16} />
          Voltar à lista
        </Link>

        {school.cover_url && (
          <div className="relative aspect-[5/2] w-full overflow-hidden rounded-3xl bg-cloud ring-2 ring-cloud-deep/40">
            <Image
              src={school.cover_url}
              alt={school.name}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
              priority
            />
          </div>
        )}

        <header className="flex items-start gap-4">
          {school.logo_url ? (
            <Image
              src={school.logo_url}
              alt={school.name}
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-2xl bg-white object-cover ring-2 ring-cloud-deep"
            />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-sky/15 text-3xl font-black text-sky-deep">
              {school.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-black leading-tight">{school.name}</h1>
            {school.legal_name && (
              <p className="text-xs text-ink/50">{school.legal_name}</p>
            )}
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink/70">
              <MapPin size={13} />
              {school.city} · {school.state}
            </p>
            {school.anac_codigo && (
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-ink/60">
                ANAC: {school.anac_codigo}
              </p>
            )}
          </div>
        </header>

        {school.description && (
          <Card>
            <CardTitle>Sobre a escola</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              {school.description}
            </p>
          </Card>
        )}

        {cursos.length > 0 && (
          <Card>
            <CardTitle>Cursos oferecidos</CardTitle>
            <ul className="mt-3 space-y-2">
              {cursos.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-2xl bg-cloud/60 px-3 py-2.5"
                >
                  <div className="flex-1">
                    <p className="font-extrabold text-ink">{c.nome ?? c.slug}</p>
                    {c.duracao_meses && (
                      <p className="text-xs text-ink/60">
                        Duração: ~{c.duracao_meses} meses
                      </p>
                    )}
                  </div>
                  {c.preco_brl && (
                    <span className="rounded-full bg-grass/15 px-3 py-1 text-sm font-extrabold text-grass-deep">
                      R$ {c.preco_brl.toLocaleString("pt-BR")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-ink/50">
              Preços informados pela escola, sujeitos a confirmação.
            </p>
          </Card>
        )}

        <Card>
          <CardTitle>Contato</CardTitle>
          <CardDesc>
            Você pode falar direto ou enviar o formulário abaixo — vamos
            encaminhar pra escola.
          </CardDesc>
          <ul className="mt-3 space-y-2 text-sm">
            <ContactRow icon={<Mail size={14} />} label="Email" value={school.email} href={`mailto:${school.email}`} />
            {school.phone && (
              <ContactRow icon={<Phone size={14} />} label="Telefone" value={school.phone} href={`tel:${school.phone}`} />
            )}
            {school.whatsapp && (
              <ContactRow icon={<MessageCircle size={14} />} label="WhatsApp" value={school.whatsapp} href={`https://wa.me/${school.whatsapp.replace(/\D/g, "")}`} />
            )}
            {school.website && (
              <ContactRow icon={<Globe size={14} />} label="Site" value={school.website} href={appendRef(school.website)} />
            )}
            {school.instagram && (
              <ContactRow icon={<Instagram size={14} />} label="Instagram" value={`@${school.instagram.replace(/^@/, "")}`} href={`https://instagram.com/${school.instagram.replace(/^@/, "")}`} />
            )}
            {school.address && (
              <li className="flex items-start gap-2 text-ink/70">
                <MapPin size={14} className="mt-0.5 shrink-0 text-ink/50" />
                <span>{school.address}</span>
              </li>
            )}
          </ul>
        </Card>

        <LeadForm
          schoolId={school.id}
          schoolName={school.name}
          cursos={cursos
            .map((c) => c.nome ?? c.slug)
            .filter((s): s is string => Boolean(s))}
        />
      </main>
    </AppShell>
  );
}

function appendRef(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("ref", "fligth");
    return u.toString();
  } catch {
    return url;
  }
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <li>
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl bg-cloud/60 px-3 py-2 hover:bg-cloud-deep/30"
      >
        <span className="text-ink/55">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-ink/50">
          {label}
        </span>
        <span className="ml-auto truncate text-sm font-extrabold text-ink">
          {value}
        </span>
      </a>
    </li>
  );
}
