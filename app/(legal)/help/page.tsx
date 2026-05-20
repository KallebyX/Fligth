import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Heart,
  Trophy,
  Gem,
  Crown,
  ShieldCheck,
  Globe,
  Smartphone,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Perguntas frequentes — CMTE Lorí",
  description:
    "FAQ do app CMTE Lorí: como funciona o estudo gamificado para a prova teórica de Piloto Privado (PPA) da ANAC, planos Pro, dúvidas comuns.",
  alternates: { canonical: "/help" },
  openGraph: {
    title: "FAQ — CMTE Lorí",
    description:
      "Tudo que você precisa saber pra começar a estudar pra prova da ANAC com o CMTE Lorí.",
  },
};

type QA = { q: string; a: React.ReactNode };

const SECTIONS: { id: string; icon: React.ReactNode; title: string; items: QA[] }[] = [
  {
    id: "comecando",
    icon: <GraduationCap size={20} />,
    title: "Começando",
    items: [
      {
        q: "O que é o CMTE Lorí?",
        a: (
          <>
            Um app gamificado pra estudar pra <strong>prova teórica de Piloto Privado (PPA) da ANAC</strong>.
            Lições curtas, ofensiva diária, ligas semanais e simulados no formato da banca. Pensado pra você
            voltar todo dia por 5–15 minutos.
          </>
        ),
      },
      {
        q: "Como começo?",
        a: (
          <>
            <Link href="/signup" className="font-bold text-sky underline-offset-4 hover:underline">
              Cria a conta grátis
            </Link>{" "}
            (email + senha, ou Google / Apple), escolhe um username, e o app já te coloca na primeira lição.
            Onboarding completo leva ~1 minuto.
          </>
        ),
      },
      {
        q: "Funciona offline?",
        a: (
          <>
            Parcialmente. Lições já carregadas ficam em cache pra você continuar mesmo com conexão ruim,
            mas o envio de progresso (XP, ofensiva, conquistas) precisa de internet — sincroniza assim que
            voltar online.
          </>
        ),
      },
      {
        q: "Em que dispositivos roda?",
        a: (
          <>
            iPhone (iOS 16+) via App Store, navegadores modernos (Chrome, Safari, Firefox, Edge) e em
            breve Android. A interface se adapta a celular, tablet e desktop.
          </>
        ),
      },
    ],
  },
  {
    id: "gameplay",
    icon: <Heart size={20} />,
    title: "Vidas, XP e gameplay",
    items: [
      {
        q: "Como funcionam as vidas (hearts)?",
        a: (
          <>
            Você começa com <strong>5 vidas</strong>. Cada resposta errada gasta 1. Sem vidas, não dá pra
            seguir lições novas. Cada vida se recompõe sozinha a cada <strong>30 minutos</strong> (todas
            cheias em ~2h30). Você pode comprar refils na loja ou ativar Pro pra ter vidas ilimitadas.
          </>
        ),
      },
      {
        q: "Como ganho XP?",
        a: (
          <>
            10 XP por questão respondida corretamente, 5 XP por mini-aula (teoria) concluída, e 10 XP de
            bônus por terminar uma lição completa. Acertou tudo? Mais bônus de &ldquo;lição perfeita&rdquo;.
          </>
        ),
      },
      {
        q: "O que é a ofensiva (streak)?",
        a: (
          <>
            Dias consecutivos com pelo menos uma lição. Quebra se você pular um dia (sem proteção). Você
            pode comprar <strong>escudos de gelo</strong> que protegem 1 dia sem treino — o app aplica
            automaticamente.
          </>
        ),
      },
      {
        q: "Como funciona a repetição espaçada (SRS)?",
        a: (
          <>
            Toda questão errada volta no dia seguinte, depois 3 dias depois, 7, 14, 30… até virar memória
            longa. Acessível em <strong>Revisar</strong> no menu. Não gasta vidas.
          </>
        ),
      },
    ],
  },
  {
    id: "ligas",
    icon: <Trophy size={20} />,
    title: "Ligas semanais",
    items: [
      {
        q: "Como funcionam as ligas?",
        a: (
          <>
            Toda segunda-feira 03:00 UTC inicia uma nova semana. Os top 10 da sua liga sobem pra próxima.
            Os últimos 5 descem. 10 divisões no total: <strong>Bronze → Diamante</strong>. XP semanal é
            só o que você ganha entre segunda e domingo.
          </>
        ),
      },
      {
        q: "Por que minha liga está vazia?",
        a: (
          <>
            Você é o primeiro da sua semana — ou nenhum amigo entrou ainda. Complete 1 lição e você
            aparecerá no ranking. À medida que mais pilotos entram na sua divisão, o leaderboard cresce.
          </>
        ),
      },
      {
        q: "Ganho recompensas por subir?",
        a: (
          <>
            Sim. Top 10 ganham gemas (até 50 pro 1º lugar). O 1º lugar também ganha um outfit raro
            aleatório pro mascote.
          </>
        ),
      },
    ],
  },
  {
    id: "loja",
    icon: <Gem size={20} />,
    title: "Loja & outfits",
    items: [
      {
        q: "O que dá pra comprar com gemas?",
        a: (
          <>
            Outfits (visuais) pro mascote Lorí — Barão Vermelho, Top Gun, Aviador Brasileiro, Pro Dourado
            e outros. Refils de vida e escudos de gelo também aceitam gemas ou compra direta.
          </>
        ),
      },
      {
        q: "Como ganho gemas?",
        a: (
          <>
            Completando lições (10–25 por lição), subindo de liga, roleta diária grátis, e atingindo
            milestones de ofensiva (50 gemas a cada 7 dias seguidos).
          </>
        ),
      },
      {
        q: "Os outfits dão vantagem competitiva?",
        a: (
          <>
            Não. São <strong>puramente cosméticos</strong>. O outfit que você escolhe aparece no seu
            avatar pra outros pilotos verem no feed e no ranking.
          </>
        ),
      },
    ],
  },
  {
    id: "pro",
    icon: <Crown size={20} />,
    title: "CMTE Lorí Pro",
    items: [
      {
        q: "O que o Pro libera?",
        a: (
          <>
            Vidas ilimitadas, simulados extras (por matéria isolada e simulados completos extras),
            estatísticas avançadas (acertos por tópico, evolução semanal), sem anúncios, suporte
            prioritário e o outfit <strong>Pro Dourado</strong> pro mascote.
          </>
        ),
      },
      {
        q: "Quanto custa?",
        a: (
          <>
            R$ 19,90/mês ou R$ 119/ano (~R$ 9,92/mês). Vitalício: R$ 299 — pague uma vez, use pra sempre.
            Mensal e anual têm <strong>7 dias grátis</strong>. Preços podem variar por região (Apple e
            Google convertem automaticamente).
          </>
        ),
      },
      {
        q: "Como cancelo?",
        a: (
          <>
            iOS: <strong>Ajustes → seu nome → Assinaturas → CMTE Lorí</strong>. Android: app do
            <strong> Google Play → Assinaturas</strong>. Web: <Link href="/pro/manage" className="font-bold text-sky underline-offset-4 hover:underline">/pro/manage</Link>.
            Cancelamento mantém acesso até o fim do período pago.
          </>
        ),
      },
      {
        q: "Posso restaurar uma compra feita em outro dispositivo?",
        a: (
          <>
            Sim. Em <Link href="/pro" className="font-bold text-sky underline-offset-4 hover:underline">/pro</Link>{" "}
            tem o botão <strong>&ldquo;Restaurar compras&rdquo;</strong>. Funciona em iOS (Apple ID) e Android
            (Google Play). No iOS, também tem em <strong>Configurações</strong> dentro do app.
          </>
        ),
      },
      {
        q: "Reembolso?",
        a: (
          <>
            Para assinaturas via App Store/Google Play, o reembolso é diretamente com a loja (Apple
            permite via{" "}
            <a
              href="https://reportaproblem.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sky underline-offset-4 hover:underline"
            >
              reportaproblem.apple.com
            </a>
            ). Para compras via Stripe (web), pedimos reembolso integral em até 7 dias —{" "}
            <a
              href="mailto:suporte@capitaolori.com"
              className="font-bold text-sky underline-offset-4 hover:underline"
            >
              suporte@capitaolori.com
            </a>
            .
          </>
        ),
      },
    ],
  },
  {
    id: "conta",
    icon: <ShieldCheck size={20} />,
    title: "Conta & dados",
    items: [
      {
        q: "Esqueci a senha.",
        a: (
          <>
            Na tela de login, toque em <strong>&ldquo;Esqueci minha senha&rdquo;</strong>. Te mandamos um link por
            email com validade de 1h. Não temos sua senha em texto puro.
          </>
        ),
      },
      {
        q: "Quero excluir minha conta.",
        a: (
          <>
            Vai em <Link href="/profile/edit" className="font-bold text-sky underline-offset-4 hover:underline">Perfil → Editar perfil</Link> e procura{" "}
            <strong>&ldquo;Excluir conta&rdquo;</strong>. Te mandamos um email de confirmação e a exclusão acontece
            em 24h. Você pode cancelar antes disso.
          </>
        ),
      },
      {
        q: "Posso usar Face ID / Touch ID?",
        a: (
          <>
            Sim, no app nativo iOS. Ative em <strong>Configurações → Face ID / Touch ID → Ativar agora</strong>.
            Da próxima vez que abrir o app, você desbloqueia com biometria em vez de digitar a senha.
          </>
        ),
      },
      {
        q: "Quem vê meu perfil?",
        a: (
          <>
            Por padrão é público (XP, ofensiva, conquistas). Vai em{" "}
            <strong>Configurações → Privacidade</strong> pra deixar privado — só amigos verão.
          </>
        ),
      },
    ],
  },
  {
    id: "tecnico",
    icon: <Smartphone size={20} />,
    title: "Problemas técnicos",
    items: [
      {
        q: "App travou ou está lento.",
        a: (
          <>
            Force fechar e reabrir (iOS: swipe up). Se persistir, mande print +{" "}
            <strong>modelo do iPhone</strong> e <strong>versão do iOS</strong> pra{" "}
            <a
              href="mailto:suporte@capitaolori.com"
              className="font-bold text-sky underline-offset-4 hover:underline"
            >
              suporte@capitaolori.com
            </a>
            .
          </>
        ),
      },
      {
        q: "Não recebo notificações push.",
        a: (
          <>
            Verifica em <strong>Ajustes do iOS → CMTE Lorí → Notificações → permitir</strong>. Depois
            ative as preferências dentro do app em <strong>Configurações → Notificações</strong>.
          </>
        ),
      },
      {
        q: "Encontrei um erro numa questão.",
        a: (
          <>
            Mande pra{" "}
            <a
              href="mailto:conteudo@capitaolori.com"
              className="font-bold text-sky underline-offset-4 hover:underline"
            >
              conteudo@capitaolori.com
            </a>{" "}
            com a referência da regulamentação. Corrigimos rápido — geralmente em &lt; 48h.
          </>
        ),
      },
    ],
  },
  {
    id: "regulamentar",
    icon: <Globe size={20} />,
    title: "Sobre a prova e a ANAC",
    items: [
      {
        q: "O CMTE Lorí é oficial da ANAC?",
        a: (
          <>
            <strong>Não.</strong> Somos um projeto independente, não filiado nem patrocinado pela ANAC.
            Material baseado em fontes públicas (RBAC, ICA, MCA, AIP-Brasil). Sempre consulte os manuais
            oficiais antes da prova ou de operar.
          </>
        ),
      },
      {
        q: "Substitui um curso teórico de PPA?",
        a: (
          <>
            <strong>Não.</strong> O curso teórico presencial ou EAD com escola credenciada pela ANAC é
            obrigatório pra fazer a prova. O CMTE Lorí é <strong>apoio</strong>: revisão eficiente,
            simulados ilimitados, fixação por repetição espaçada.
          </>
        ),
      },
      {
        q: "Onde faço a prova de verdade?",
        a: (
          <>
            Nos centros aplicadores credenciados pela ANAC, listados no site oficial da agência. O
            agendamento e pagamento também são feitos lá.
          </>
        ),
      },
    ],
  },
];

export default function HelpPage() {
  // JSON-LD FAQPage helps SEO indexing in Google.
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SECTIONS.flatMap((s) =>
      s.items.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: {
          "@type": "Answer",
          text:
            typeof it.a === "string" ? it.a : extractText(it.a),
        },
      })),
    ),
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <header>
        <h1 className="text-3xl font-black md:text-4xl">Perguntas frequentes</h1>
        <p className="mt-2 text-ink/70 dark:text-cloud/70">
          Tudo que você precisa saber sobre o CMTE Lorí. Não achou a resposta?{" "}
          <a
            href="mailto:suporte@capitaolori.com"
            className="font-bold text-sky underline-offset-4 hover:underline"
          >
            <Mail size={14} className="inline align-text-bottom" /> suporte@capitaolori.com
          </a>
        </p>
      </header>

      {/* TOC */}
      <nav className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="card-pop flex items-center gap-2 p-3 text-xs font-extrabold uppercase tracking-wider transition-transform hover:-translate-y-0.5"
          >
            <span className="text-sky">{s.icon}</span>
            {s.title}
          </a>
        ))}
      </nav>

      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-20 space-y-3">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <span className="text-sky">{s.icon}</span>
            {s.title}
          </h2>
          <div className="space-y-3">
            {s.items.map((it) => (
              <details
                key={it.q}
                className="card-pop group cursor-pointer p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-start justify-between gap-3 text-base font-extrabold leading-snug text-ink dark:text-cloud">
                  <span>{it.q}</span>
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-ink/40 transition-transform group-open:rotate-45 dark:text-cloud/40"
                  >
                    +
                  </span>
                </summary>
                <div className="mt-3 text-sm leading-relaxed text-ink/80 dark:text-cloud/80">
                  {it.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <Card className="text-center">
        <CardTitle>Ainda com dúvida?</CardTitle>
        <CardDesc className="mt-2">
          A equipe responde por email — sem chatbot. Mande pra suporte@capitaolori.com.
        </CardDesc>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <a
            href="mailto:suporte@capitaolori.com"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-sky px-5 text-sm font-extrabold uppercase tracking-wider text-white shadow-pop hover:bg-sky-deep"
          >
            <Mail size={16} aria-hidden />
            Falar com a gente
          </a>
        </div>
      </Card>
    </div>
  );
}

// Recursively walks the React node and pulls plain text out — used to fill
// the FAQPage JSON-LD `text` field. Approximate but covers our use case
// (strings + <strong>/<a>/<Link> children).
function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in (node as object)) {
    const props = (node as { props?: { children?: React.ReactNode } }).props;
    return extractText(props?.children);
  }
  return "";
}
