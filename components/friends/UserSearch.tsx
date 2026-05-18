"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchUsers, type DiscoverUser } from "@/app/actions/discover";
import { UserCard } from "@/components/friends/UserCard";

export function UserSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<DiscoverUser[]>([]);
  const [pending, start] = useTransition();
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setTouched(true);
    const handle = window.setTimeout(() => {
      start(async () => {
        const res = await searchUsers(q);
        if (res.ok) setResults(res.users);
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [q]);

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink/40 dark:text-cloud/40">
          {pending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Search size={18} />
          )}
        </span>
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar pilotos por @ ou nome…"
          className="h-12 w-full rounded-2xl border-2 border-cloud-deep bg-white pl-10 pr-4 text-base font-medium outline-none focus:border-sky dark:border-ink-light dark:bg-ink-mid dark:text-cloud dark:placeholder:text-cloud/40"
        />
      </div>

      {touched && q.trim().length >= 2 && results.length === 0 && !pending && (
        <p className="mt-3 text-center text-sm text-ink/60 dark:text-cloud/60">
          Ninguém encontrado com esse @.
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-3 grid gap-2">
          {results.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
