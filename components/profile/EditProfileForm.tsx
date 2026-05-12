"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Save, AtSign, Loader2 } from "lucide-react";
import { updateProfile, setUsername } from "@/app/actions/profile";
import { notify } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const COLORS = [
  { slug: "sky",   class: "bg-sky" },
  { slug: "grass", class: "bg-grass" },
  { slug: "sun",   class: "bg-sun" },
  { slug: "alert", class: "bg-alert" },
  { slug: "gold",  class: "bg-gold" },
  { slug: "ink",   class: "bg-ink" },
];

const COUNTRIES = [
  { code: "", name: "—" },
  { code: "BR", name: "Brasil" },
  { code: "PT", name: "Portugal" },
  { code: "US", name: "Estados Unidos" },
  { code: "ES", name: "Espanha" },
  { code: "AR", name: "Argentina" },
  { code: "MX", name: "México" },
];

const USERNAME_ERRORS: Record<string, string> = {
  username_invalid_format: "Use 3–20 caracteres, apenas letras minúsculas, números e _.",
  username_reserved: "Esse @ é reservado. Escolhe outro.",
  username_taken: "Esse @ já está em uso.",
  unauthenticated: "Faça login novamente.",
};

export type EditProfileInitial = {
  username: string | null;
  display_name: string | null;
  bio: string | null;
  country_code: string | null;
  profile_color: string;
  profile_public: boolean;
};

export function EditProfileForm({ initial }: { initial: EditProfileInitial }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [savingUsername, startUsername] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSaved, setUsernameSaved] = useState(false);

  const [username, setUsernameLocal] = useState(initial.username ?? "");
  const [displayName, setDisplayName] = useState(initial.display_name ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [country, setCountry] = useState(initial.country_code ?? "");
  const [color, setColor] = useState(initial.profile_color);
  const [isPublic, setIsPublic] = useState(initial.profile_public);

  function saveUsername() {
    setUsernameError(null);
    setUsernameSaved(false);
    startUsername(async () => {
      const res = await setUsername(username);
      if (!res.ok) {
        setUsernameError(USERNAME_ERRORS[res.error] ?? res.error);
        void notify("error");
        return;
      }
      setUsernameSaved(true);
      void notify("success");
      router.refresh();
    });
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await updateProfile({
        display_name: displayName,
        bio,
        country_code: country,
        profile_color: color,
        profile_public: isPublic,
      });
      if (!res.ok) {
        setError(res.error);
        void notify("error");
        return;
      }
      void notify("success");
      router.push(username ? `/profile/${username}` : "/profile");
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle>Seu @</CardTitle>
        <CardDesc>Como amigos te encontram. Só pode ser alterado por enquanto.</CardDesc>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink/40">
              <AtSign size={18} />
            </span>
            <input
              value={username}
              onChange={(e) =>
                setUsernameLocal(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              maxLength={20}
              placeholder="seu_at"
              className="h-12 w-full rounded-2xl border-2 border-cloud-deep bg-white pl-10 pr-3 text-base font-medium outline-none focus:border-sky"
            />
          </div>
          <Button onClick={saveUsername} disabled={savingUsername || !username}>
            {savingUsername ? <Loader2 size={16} className="animate-spin" /> : "Salvar"}
          </Button>
        </div>
        {usernameError && (
          <p className="mt-2 text-sm font-bold text-alert">{usernameError}</p>
        )}
        {usernameSaved && (
          <p className="mt-2 text-sm font-bold text-grass">Username atualizado ✓</p>
        )}
      </Card>

      <Card>
        <CardTitle>Sobre você</CardTitle>
        <CardDesc>Mostre quem é o piloto. Tudo opcional.</CardDesc>

        <div className="mt-3 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Nome de exibição
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              placeholder="Capitão Lorí"
              className="mt-1 h-12 w-full rounded-2xl border-2 border-cloud-deep bg-white px-3 text-base font-medium outline-none focus:border-sky"
            />
          </div>

          <div>
            <label className="flex justify-between text-xs font-bold uppercase tracking-wider text-ink/60">
              <span>Bio</span>
              <span>{bio.length}/280</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 280))}
              rows={3}
              placeholder="Pretendo virar piloto privado em..."
              className="mt-1 w-full resize-none rounded-2xl border-2 border-cloud-deep bg-white p-3 text-base font-medium outline-none focus:border-sky"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
              País
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 h-12 w-full rounded-2xl border-2 border-cloud-deep bg-white px-3 text-base font-medium outline-none focus:border-sky"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Cor do perfil
            </label>
            <div className="mt-1 flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setColor(c.slug)}
                  aria-label={`Cor ${c.slug}`}
                  className={cn(
                    "h-10 w-10 rounded-full border-2 transition-transform",
                    c.class,
                    color === c.slug
                      ? "border-ink scale-110 shadow-pop"
                      : "border-white/60",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-cloud-deep p-3">
            <label className="flex items-center justify-between gap-3">
              <span>
                <p className="text-sm font-extrabold">Perfil público</p>
                <p className="text-xs text-ink/60">
                  Quando desligado, ninguém pode te seguir nem ver seu feed.
                </p>
              </span>
              <button
                type="button"
                onClick={() => setIsPublic((v) => !v)}
                aria-pressed={isPublic}
                className={cn(
                  "relative h-7 w-12 rounded-full transition-colors",
                  isPublic ? "bg-grass" : "bg-cloud-deep",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
                    isPublic ? "left-[22px]" : "left-0.5",
                  )}
                />
              </button>
            </label>
          </div>
        </div>

        {error && <p className="mt-3 text-sm font-bold text-alert">{error}</p>}

        <div className="mt-5">
          <Button onClick={save} disabled={pending} className="w-full" size="lg">
            {pending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Salvar alterações
          </Button>
        </div>
      </Card>
    </div>
  );
}
