"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.error("[profile] render error:", error.message, error.digest);
    }
  }, [error]);

  return (
    <main className="container max-w-md py-10">
      <div className="card-soft space-y-5 p-6 text-center">
        <div className="mx-auto inline-flex items-center justify-center">
          <Mascot state="confused" size={120} />
        </div>
        <div>
          <h1 className="text-xl font-black">Hmm, algo deu errado</h1>
          <p className="mt-1 text-sm text-ink/60">
            Não consegui carregar seu perfil. Pode ser sua sessão ou conexão —
            tente recarregar.
          </p>
        </div>
        {error.digest && (
          <p className="rounded-xl bg-cloud/60 px-3 py-2 font-mono text-[11px] tabular-nums text-ink/50">
            Código: {error.digest}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button onClick={reset} size="lg" className="w-full">
            <RotateCw size={16} />
            Tentar de novo
          </Button>
          <Link
            href="/learn"
            className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-cloud-deep bg-white px-4 py-3 text-sm font-extrabold text-ink transition-colors hover:bg-cloud/40"
          >
            Voltar para aprender
          </Link>
        </div>
      </div>
    </main>
  );
}
