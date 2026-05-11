import type { Metadata } from "next";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Mail, MessageCircle, ShieldAlert, FileQuestion } from "lucide-react";

export const metadata: Metadata = {
  title: "Suporte — Capitão Lorí",
  description: "Como entrar em contato com a equipe do Capitão Lorí.",
};

const channels = [
  {
    icon: <Mail className="text-sky" size={28} />,
    title: "Suporte geral",
    href: "mailto:suporte@capitaolori.app",
    body: "Dúvidas sobre o app, problemas técnicos, sugestões. Respondemos em até 48h úteis.",
  },
  {
    icon: <ShieldAlert className="text-alert" size={28} />,
    title: "Privacidade e dados",
    href: "mailto:privacidade@capitaolori.app",
    body: "Solicitar acesso, correção, exclusão ou portabilidade dos seus dados (LGPD).",
  },
  {
    icon: <FileQuestion className="text-grass" size={28} />,
    title: "Conteúdo das lições",
    href: "mailto:conteudo@capitaolori.app",
    body: "Apontar erro técnico/regulamentar em uma questão ou lição. Incluir a referência da fonte ajuda muito.",
  },
  {
    icon: <MessageCircle className="text-sun" size={28} />,
    title: "Imprensa e parcerias",
    href: "mailto:contato@capitaolori.app",
    body: "Aeroclubes, instrutores e veículos de imprensa.",
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black md:text-4xl">Suporte</h1>
        <p className="mt-2 text-ink/70">
          Escolha o canal mais próximo do seu assunto. Estamos focados em resposta humana — sem
          chatbot.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((c) => (
          <a
            key={c.title}
            href={c.href}
            className="card-pop block p-6 transition-transform hover:-translate-y-1"
          >
            <div className="mb-3">{c.icon}</div>
            <h3 className="mb-1 text-base font-extrabold text-ink">{c.title}</h3>
            <p className="text-sm text-ink/70 leading-relaxed">{c.body}</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-sky">
              {c.href.replace("mailto:", "")}
            </p>
          </a>
        ))}
      </div>

      <Card>
        <CardTitle>FAQ rápido</CardTitle>
        <CardDesc>Antes de escrever, talvez seja uma destas:</CardDesc>
        <ul className="mt-3 space-y-3 text-sm">
          <li>
            <strong>Posso usar para fazer a prova real?</strong> Capitão Lorí é apoio ao estudo. A
            prova oficial é feita exclusivamente nos centros aplicadores credenciados pela ANAC.
          </li>
          <li>
            <strong>Por que perco vidas?</strong> Erros em lições gastam 1 coração. Você recupera 1
            a cada 30 minutos, ou aguarda a regeneração total em 2h30. Revisões (/review) não
            gastam vidas.
          </li>
          <li>
            <strong>Esqueci a senha.</strong> Use o link &ldquo;esqueci minha senha&rdquo; na tela de login.
            Não temos acesso à sua senha em texto puro.
          </li>
          <li>
            <strong>Quero excluir minha conta.</strong> Pelo perfil ou enviando e-mail para
            privacidade@capitaolori.app. Apagamos em até 30 dias.
          </li>
          <li>
            <strong>Encontrei um erro numa questão.</strong> Manda pra conteudo@capitaolori.app com
            a referência regulatória. Corrigimos rápido.
          </li>
        </ul>
      </Card>
    </div>
  );
}
