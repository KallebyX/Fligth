"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertSchool, type SchoolUpsertInput, type CursoInput } from "@/app/actions/adminSchools";
import { UFS } from "@/lib/validators";
import { toSlug } from "@/lib/slug";

export type Initial = Partial<SchoolUpsertInput>;

export function SchoolUpsertForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [legalName, setLegalName] = useState(initial?.legal_name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "SP");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [instagram, setInstagram] = useState(initial?.instagram ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [anacCodigo, setAnacCodigo] = useState(initial?.anac_codigo ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [cursos, setCursos] = useState<CursoInput[]>(initial?.cursos ?? []);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function autoSlug(value: string) {
    if (slug) return;
    setSlug(toSlug(value));
  }

  function addCurso() {
    setCursos([...cursos, { nome: "" }]);
  }
  function updateCurso(idx: number, patch: Partial<CursoInput>) {
    setCursos(cursos.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }
  function removeCurso(idx: number) {
    setCursos(cursos.filter((_, i) => i !== idx));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await upsertSchool({
        id: initial?.id,
        slug,
        name,
        legal_name: legalName || undefined,
        description: description || undefined,
        logo_url: logoUrl || undefined,
        cover_url: coverUrl || undefined,
        city,
        state,
        address: address || undefined,
        phone: phone || undefined,
        email,
        website: website || undefined,
        instagram: instagram || undefined,
        whatsapp: whatsapp || undefined,
        cursos: cursos.filter((c) => c.nome.trim()),
        anac_codigo: anacCodigo || undefined,
        featured,
      });
      if (!res.ok) {
        setError(translateError(res.error));
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/admin/escolas"), 1000);
    });
  }

  if (done) {
    return (
      <Card className="text-center">
        <CheckCircle2 size={48} className="mx-auto text-grass" />
        <CardTitle className="mt-3">{initial?.id ? "Atualizado!" : "Cadastrada!"}</CardTitle>
        <CardDesc className="mt-1">Redirecionando…</CardDesc>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card>
        <CardTitle>Informações básicas</CardTitle>
        <div className="mt-3 space-y-3">
          <div>
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                autoSlug(e.target.value);
              }}
              required
              autoComplete="organization"
              className="mt-1"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Slug (URL)</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="acas-santos"
                required
                className="mt-1 font-mono"
              />
              <p className="mt-1 text-[11px] text-ink/50">/escolas/{slug || "exemplo"}</p>
            </div>
            <div>
              <Label>Razão social</Label>
              <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-2xl border-2 border-cloud-deep bg-white p-3 text-sm focus:border-sky focus:outline-none"
            />
          </div>
          <div>
            <Label>Código ANAC (CIAC/CTAC)</Label>
            <Input value={anacCodigo} onChange={(e) => setAnacCodigo(e.target.value)} className="mt-1" />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Localização</CardTitle>
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[2fr,1fr]">
            <div>
              <Label>Cidade</Label>
              <Input autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label>UF</Label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-1 w-full rounded-2xl border-2 border-cloud-deep bg-white p-3 text-sm font-bold focus:border-sky focus:outline-none"
              >
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>Endereço completo</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Contato</CardTitle>
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Email (recebe leads)</Label>
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>WhatsApp</Label>
              <Input type="tel" inputMode="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5511..." className="mt-1" />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@escola" className="mt-1" />
            </div>
            <div>
              <Label>Site</Label>
              <Input type="url" inputMode="url" autoComplete="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="mt-1" />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Imagens</CardTitle>
        <CardDesc className="mt-1">URLs públicas (Cloudinary, Imgur, Supabase Storage).</CardDesc>
        <div className="mt-3 space-y-3">
          <div>
            <Label>Logo (96×96)</Label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" className="mt-1" />
          </div>
          <div>
            <Label>Capa (1200×480)</Label>
            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://…" className="mt-1" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Cursos</CardTitle>
            <CardDesc className="mt-1">Modalidades oferecidas com preço (opcional).</CardDesc>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addCurso}>
            <Plus size={14} />
            Adicionar
          </Button>
        </div>
        {cursos.length === 0 ? (
          <p className="mt-3 text-xs text-ink/55">Nenhum curso cadastrado ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {cursos.map((c, i) => (
              <li key={i} className="rounded-2xl border-2 border-cloud-deep bg-white p-3">
                <div className="grid gap-2 sm:grid-cols-[2fr,1fr,1fr,auto]">
                  <Input
                    value={c.nome ?? ""}
                    onChange={(e) => updateCurso(i, { nome: e.target.value })}
                    placeholder="PP-A"
                  />
                  <Input
                    type="number"
                    value={c.preco_brl ?? ""}
                    onChange={(e) => updateCurso(i, { preco_brl: Number(e.target.value) || undefined })}
                    placeholder="25000"
                  />
                  <Input
                    type="number"
                    value={c.duracao_meses ?? ""}
                    onChange={(e) => updateCurso(i, { duracao_meses: Number(e.target.value) || undefined })}
                    placeholder="6 (meses)"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeCurso(i)}
                    aria-label="Remover curso"
                    className="border-alert text-alert hover:bg-alert/10"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-cloud-deep accent-gold"
          />
          <div>
            <p className="font-extrabold">Destaque</p>
            <p className="text-xs text-ink/60">
              Escolas em destaque aparecem no topo de /escolas com badge dourado.
            </p>
          </div>
        </label>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {initial?.id ? "Salvar alterações" : "Cadastrar escola"}
      </Button>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
      {children}
    </label>
  );
}

function translateError(err: string): string {
  const map: Record<string, string> = {
    unauthenticated: "Faça login.",
    forbidden: "Sem permissão.",
    slug_invalid: "Slug inválido — use letras minúsculas, números e hífens.",
    state_invalid: "UF inválido — use 2 letras maiúsculas.",
    email_invalid: "Email inválido.",
    insert_failed: "Falha ao salvar. Pode ser slug duplicado.",
  };
  return map[err] ?? `Erro: ${err}`;
}
