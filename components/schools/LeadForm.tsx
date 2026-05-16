"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle, Loader2, Send } from "lucide-react";
import { submitSchoolLead } from "@/app/actions/schools";

export function LeadForm({
  schoolId,
  schoolName,
  cursos,
}: {
  schoolId: string;
  schoolName: string;
  cursos: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [courseInterest, setCourse] = useState(cursos[0] ?? "");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reward, setReward] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("Marque a caixa de consentimento pra continuar.");
      return;
    }
    startTransition(async () => {
      const res = await submitSchoolLead({
        schoolId,
        name,
        email,
        phone,
        courseInterest: courseInterest || undefined,
        message: message || undefined,
        consent,
        source: "school_page",
      });
      if (!res.ok) {
        setError(translateError(res.error));
        return;
      }
      setDone(true);
      setReward(res.reward);
      setTimeout(() => router.refresh(), 1500);
    });
  }

  if (done) {
    return (
      <Card className="text-center">
        <CheckCircle2 size={48} className="mx-auto text-grass" />
        <h2 className="mt-3 text-lg font-black">Mensagem enviada!</h2>
        <p className="mt-1 text-sm text-ink/70">
          A {schoolName} vai entrar em contato em breve no email e telefone
          que você informou.
        </p>
        {reward && reward > 0 && (
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-gold/20 px-3 py-1 text-sm font-extrabold text-gold">
            +{reward} gems 💎
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>Quero saber mais sobre essa escola</CardTitle>
      <CardDesc>
        Preencha que a gente encaminha pra escola e te avisa quando responderem.
        Você ganha 10 gems pelo primeiro contato com cada escola.
      </CardDesc>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
            Nome
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="mt-1"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
              WhatsApp
            </label>
            <Input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              required
              autoComplete="tel"
              className="mt-1"
            />
          </div>
        </div>
        {cursos.length > 0 && (
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Curso de interesse
            </label>
            <select
              value={courseInterest}
              onChange={(e) => setCourse(e.target.value)}
              className="mt-1 w-full rounded-2xl border-2 border-cloud-deep bg-white p-3 text-sm focus:border-sky focus:outline-none"
            >
              <option value="">Quero apenas informações gerais</option>
              {cursos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
            Mensagem (opcional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder="Ex: Tenho 25 anos, sem experiência, quero começar do zero."
            className="mt-1 w-full rounded-2xl border-2 border-cloud-deep bg-white p-3 text-sm focus:border-sky focus:outline-none"
          />
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cloud/60 p-3 text-xs leading-snug text-ink/75">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-cloud-deep accent-sky"
          />
          <span>
            Autorizo o app a compartilhar meus dados com a {schoolName} para
            que entrem em contato sobre o curso de meu interesse, conforme a
            <strong> Política de Privacidade</strong>.
          </span>
        </label>
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {pending ? "Enviando…" : "Enviar mensagem"}
        </Button>
      </form>
    </Card>
  );
}

function translateError(err: string): string {
  const map: Record<string, string> = {
    unauthenticated: "Faça login pra enviar.",
    consent_required: "Você precisa autorizar o compartilhamento.",
    name_invalid: "Nome inválido (2–100 caracteres).",
    email_invalid: "Email inválido.",
    phone_invalid: "Telefone inválido. Use formato (DDD) XXXXX-XXXX.",
    insert_failed: "Não consegui enviar agora. Tente de novo.",
  };
  return map[err] ?? `Erro: ${err}`;
}
