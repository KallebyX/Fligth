import type { Metadata } from "next";
import { Markdown } from "@/components/ui/markdown";

export const metadata: Metadata = {
  title: "Termos de Uso — CMTE Lorí",
  description: "Termos e condições de uso do app CMTE Lorí.",
};

const CONTENT = `## Termos de Uso

**Última atualização:** 11 de maio de 2026.

Ao criar uma conta e usar o **CMTE Lorí** ("app"), você concorda com estes termos. Se discordar, por favor não use o app.

### 1. O que é o CMTE Lorí

Aplicativo independente de **apoio ao estudo** para a prova teórica de Piloto Privado de Avião (PPA). Oferece lições, questões, simulado no formato da banca, gamificação (XP, streaks, ligas) e revisão espaçada.

**Não somos** a ANAC, banca examinadora ou aeroclube. Não filiado, endossado ou patrocinado pela ANAC.

### 2. Conteúdo educacional

- O material foi redigido com base em fontes públicas: **RBAC, ICA, MCA, AIP-Brasil**, manuais FAA e bibliografia aberta.
- Não copiamos questões de bancas comerciais.
- **O conteúdo é educativo e não substitui** os manuais oficiais, instrutor de voo certificado nem o POH (Pilot's Operating Handbook) da sua aeronave.
- Decisões operacionais reais devem se basear nos documentos oficiais e na orientação do seu instrutor.

### 3. Sua conta

- Você precisa ter **pelo menos 13 anos** para criar uma conta.
- Você é responsável por manter a senha segura.
- Uma conta por pessoa; não compartilhar credenciais.

### 4. Conduta esperada

Você concorda em **não**:

- Usar o app para fins ilícitos.
- Tentar burlar a segurança (RLS, autenticação, rate limits).
- Coletar dados de outros usuários.
- Engenharia reversa, scraping massivo, automatizar uso.
- Postar conteúdo ofensivo, discriminatório ou ilegal em campos abertos (username etc.).

Violações podem levar a **suspensão ou exclusão da conta** sem aviso.

### 5. Propriedade intelectual

- O código-fonte do app é nosso (ou de quem nos licenciou). Você não obtém direito de redistribuir.
- O conteúdo das lições e questões é nosso. Você pode usá-lo para **estudo pessoal**, não para republicação.
- Marca, nome e identidade visual são protegidos.

### 6. Disponibilidade

O serviço é fornecido "**como está**". Não garantimos disponibilidade 24/7 nem isenção de erros. Faremos esforço razoável para manter o app online e o conteúdo atualizado.

### 7. Limitação de responsabilidade

Na máxima extensão permitida em lei:

- **Não somos responsáveis** por reprovação na prova da ANAC, decisões operacionais em voo, perdas financeiras ou danos indiretos.
- **Não substituímos instrutor de voo, POH nem manuais oficiais.**
- Em caso de qualquer responsabilização, o limite máximo é o valor que você tenha pago pelo serviço nos últimos 12 meses (atualmente: R$ 0 — o app é gratuito).

### 8. Pagamentos (quando aplicável)

Hoje o app é gratuito. Caso introduzamos planos pagos:
- Preços serão comunicados antes da contratação.
- Cancelamento e reembolso seguirão o Código de Defesa do Consumidor.
- Compras realizadas via App Store ou Google Play seguem as políticas da respectiva loja.

### 9. Encerramento

Você pode **excluir a conta a qualquer momento** pela página de perfil ou enviando e-mail para suporte@capitaolori.com. Os dados serão apagados em até 30 dias, salvo obrigação legal de retenção.

Podemos suspender o serviço caso o app deixe de ser viável; nesse caso, daremos 30 dias de aviso e exportação dos seus dados.

### 10. Foro e legislação

Estes termos são regidos pelas leis brasileiras. Fica eleito o **foro da comarca de São Paulo/SP** para dirimir controvérsias, salvo competência territorial obrigatória do consumidor.

### 11. Contato

Dúvidas, sugestões ou solicitações: **suporte@capitaolori.com**`;

export default function TermsPage() {
  return (
    <article className="card-pop p-8">
      <Markdown content={CONTENT} />
    </article>
  );
}
