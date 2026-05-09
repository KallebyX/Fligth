import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";

export default function Landing() {
  return (
    <main className="min-h-screen">
      <div className="container flex min-h-screen flex-col items-center justify-center gap-10 py-12 text-center">
        <Mascot state="celebrate" size={160} />

        <div className="space-y-4 max-w-2xl">
          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            O <span className="text-sky">Duolingo</span> da{" "}
            <span className="text-sun">ANAC</span> chegou.
          </h1>
          <p className="text-lg text-ink/70 md:text-xl">
            Estude para a prova teórica de Piloto Privado em <strong>5 minutos por dia</strong>.
            Lições curtas, simulado oficial, ofensiva e mascote bombado. Aprovação com hábito,
            não com sofrimento.
          </p>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-3">
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
        </div>

        <ul className="grid w-full max-w-3xl gap-4 text-left md:grid-cols-3">
          <Feature title="5 matérias oficiais" body="Regulamentos, Meteorologia, Navegação, Teoria de Voo e Conhecimentos Técnicos." />
          <Feature title="Simulado real" body="100 questões em 3h, exatamente como a banca da ANAC. 70% por matéria." />
          <Feature title="Revisão inteligente" body="O que você errou volta no momento certo, com repetição espaçada." />
        </ul>

        <footer className="pt-8 text-xs text-ink/40">
          Conteúdo educacional baseado em fontes públicas (RBAC 91, ICA 100-12, MCA, AIP-Brasil).
          Não filiado à ANAC.
        </footer>
      </div>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <li className="card-pop p-5">
      <h3 className="mb-1 text-base font-extrabold text-ink">{title}</h3>
      <p className="text-sm text-ink/70 leading-relaxed">{body}</p>
    </li>
  );
}
