"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SchoolFilters({
  ufs,
  currentUf,
  currentQ,
}: {
  ufs: string[];
  currentUf: string | null;
  currentQ: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(currentQ ?? "");
  const [, startTransition] = useTransition();

  function buildUrl(patch: { uf?: string | null; q?: string | null }) {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (patch.uf === null) next.delete("uf");
    else if (patch.uf !== undefined) next.set("uf", patch.uf);
    if (patch.q === null) next.delete("q");
    else if (patch.q !== undefined) next.set("q", patch.q);
    const qs = next.toString();
    return qs ? `/escolas?${qs}` : "/escolas";
  }

  function pickUf(uf: string | null) {
    startTransition(() => {
      router.push(buildUrl({ uf }));
    });
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(buildUrl({ q: q.trim() || null }));
    });
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 dark:text-cloud/40"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar escola por nome…"
            className="pl-9"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                pickUf(currentUf);
                router.push(buildUrl({ q: null }));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/40 hover:text-ink dark:text-cloud/40 dark:hover:text-cloud"
              aria-label="Limpar busca"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <Button type="submit" size="md" variant="outline">
          Buscar
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => pickUf(null)}
          className={chipCls(currentUf === null)}
        >
          Todos
        </button>
        {ufs.map((uf) => (
          <button
            key={uf}
            type="button"
            onClick={() => pickUf(uf)}
            className={chipCls(currentUf === uf)}
          >
            {uf}
          </button>
        ))}
      </div>
    </div>
  );
}

function chipCls(active: boolean): string {
  return [
    "rounded-full border-2 px-3 py-1 text-xs font-extrabold transition-colors",
    active
      ? "border-sky bg-sky text-white"
      : "border-cloud-deep bg-white text-ink/70 hover:bg-cloud/50 dark:border-ink-light dark:bg-ink-mid dark:text-cloud/70 dark:hover:bg-ink-mid/70",
  ].join(" ");
}
