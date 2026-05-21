"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { useReducedMotion } from "@/lib/motion";

const STORAGE_KEY = "lori.learn.welcomed";

// Mostrado UMA vez quando o usuário acabou de completar /onboarding e cai
// em /learn?welcome=1. Saúda pelo nome, dica de primeira ação. Persistente
// via localStorage para nunca aparecer duas vezes — mesmo que o usuário
// recarregue /learn?welcome=1 manualmente.
export function WelcomeBanner({
  displayName,
  outfit,
}: {
  displayName: string;
  outfit?: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const reducedMotion = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (params.get("welcome") !== "1") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    setShow(true);
  }, [params]);

  function dismiss() {
    setShow(false);
    window.localStorage.setItem(STORAGE_KEY, "1");
    // Limpa o ?welcome=1 da URL sem reload pra não reativar em volta.
    const url = new URL(window.location.href);
    url.searchParams.delete("welcome");
    router.replace(url.pathname + (url.search || ""), { scroll: false });
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-sky to-grass p-5 text-white shadow-pop"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-full bg-white/15 p-1.5 ring-2 ring-white/30">
              <Mascot state="celebrate" size={72} outfit={outfit ?? null} />
            </div>
            <div className="flex-1">
              <p className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                <Sparkles size={11} />
                Bem-vindo a bordo
              </p>
              <h2 className="mt-1.5 text-xl font-black leading-tight md:text-2xl">
                Pronto pra decolar, {displayName}?
              </h2>
              <p className="mt-1 text-sm leading-snug opacity-95">
                Comece pela primeira lição abaixo. 5 minutos hoje já valem
                pra manter sua ofensiva.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fechar boas-vindas"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/85 hover:bg-white/15"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
