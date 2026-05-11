"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { Flame, Heart, Star, Trophy, BookOpen, Plane, ShieldCheck } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: "easeOut" },
};

export default function Landing() {
  return (
    <main className="overflow-x-hidden">
      <section className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[60vh] bg-gradient-to-b from-sky/10 via-cloud to-cloud" />
        <div className="container flex min-h-[88vh] flex-col items-center justify-center gap-8 py-12 text-center">
          <motion.div
            initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
          >
            <Mascot state="celebrate" size={160} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4 max-w-2xl"
          >
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Estude pra <span className="text-sky">Piloto Privado</span> em{" "}
              <span className="text-sun">5 minutos por dia</span>.
            </h1>
            <p className="text-lg text-ink/70 md:text-xl">
              Lições curtinhas, ofensiva diária, simulado no formato da banca e um papagaio aviador
              de mascote. Aprovação com hábito, não com sofrimento.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex w-full max-w-sm flex-col gap-3"
          >
            <Link href="/signup">
              <Button size="lg" className="w-full">
                Começar de graça
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full">
                Já tenho conta
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-ink/50"
          >
            5 trilhas · 25 lições · 100 questões · simulado de 3 horas
          </motion.p>
        </div>
      </section>

      <section className="container max-w-5xl py-16">
        <motion.h2 {...fadeUp} className="mb-10 text-center text-3xl font-black md:text-4xl">
          Por que dá certo
        </motion.h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={<Flame className="text-sun" size={28} />}
            title="Ofensiva diária"
            body="Conta dias seguidos estudando. Estudos mostram que streaks aumentam conclusão em 60 %."
          />
          <Feature
            icon={<Heart className="text-alert" size={28} />}
            title="5 vidas que regeneram"
            body="Errar custa um coração — mas você recupera 1 a cada 30 min. Sem pressa, sem castigo eterno."
          />
          <Feature
            icon={<BookOpen className="text-sky" size={28} />}
            title="Revisão espaçada"
            body="O que você errou volta no momento certo (1d, 6d, 14d…) usando o algoritmo SM-2."
          />
          <Feature
            icon={<Trophy className="text-gold" size={28} />}
            title="Ligas semanais"
            body="Bronze, prata, ouro e diamante. Top 10 sobem, bottom 5 caem. Competição amigável."
          />
          <Feature
            icon={<Plane className="text-grass" size={28} />}
            title="Simulado de verdade"
            body="100 questões em 3 horas — 20 por matéria, exatamente como o formato da banca."
          />
          <Feature
            icon={<Star className="text-gold" size={28} />}
            title="Conquistas"
            body="Primeira lição, streak de 30 dias, aprovação no simulado, lição perfeita. Tem motivo pra voltar amanhã."
          />
        </div>
      </section>

      <section className="container max-w-3xl py-16">
        <motion.div
          {...fadeUp}
          className="card-pop space-y-3 bg-gradient-to-br from-sky/10 to-grass/10 p-8"
        >
          <ShieldCheck className="text-grass" size={32} />
          <h3 className="text-xl font-black md:text-2xl">As 5 matérias da prova teórica</h3>
          <p className="text-ink/70">
            Regulamentos de Tráfego Aéreo · Meteorologia · Navegação Aérea · Teoria de Voo ·
            Conhecimentos Técnicos. Todas mapeadas em unidades, lições e questões com explicação,
            referência regulatória e nível de dificuldade.
          </p>
        </motion.div>
      </section>

      <footer className="border-t border-cloud-deep/40 bg-white/40">
        <div className="container max-w-3xl py-8 text-center">
          <p className="text-xs leading-relaxed text-ink/50">
            <strong>Capitão Lorí</strong> é um projeto de estudo independente.{" "}
            <strong>Não filiado, endossado ou patrocinado pela ANAC</strong>. Conteúdo educacional
            redigido a partir de fontes públicas (RBAC 91, ICA 100-12, MCA 100-1, AIP-Brasil) —
            sempre consulte os manuais e instruções oficiais da agência reguladora antes de operar.
          </p>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <motion.div {...fadeUp} className="card-pop p-6 transition-transform hover:-translate-y-1">
      <div className="mb-3">{icon}</div>
      <h3 className="mb-1 text-base font-extrabold text-ink">{title}</h3>
      <p className="text-sm text-ink/70 leading-relaxed">{body}</p>
    </motion.div>
  );
}
