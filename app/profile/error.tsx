"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="card-pop space-y-4 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-alert/10 text-alert">
          <AlertTriangle size={28} />
        </div>
        <div>
          <h1 className="text-xl font-black">Não consegui carregar seu perfil</h1>
          <p className="mt-1 text-sm text-ink/60">
            Algo deu errado ao buscar seus dados. Tente recarregar.
          </p>
        </div>
        {error.digest && (
          <p className="rounded-xl bg-cloud/60 px-3 py-2 font-mono text-[11px] text-ink/50">
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
            className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-cloud-deep bg-white px-4 py-3 text-sm font-extrabold text-ink hover:bg-cloud/40"
          >
            Voltar para aprender
          </Link>
        </div>
      </div>
    </main>
  );
}
