import type { Metadata } from "next";
import { Markdown } from "@/components/ui/markdown";

export const metadata: Metadata = {
  title: "Política de Privacidade — Capitão Lorí",
  description:
    "Como o Capitão Lorí coleta, usa e protege seus dados. Conforme a LGPD (Lei 13.709/2018).",
};

const CONTENT = `## Política de Privacidade

**Última atualização:** 11 de maio de 2026.

O **Capitão Lorí** ("nós", "app") é um aplicativo independente de estudo para a prova teórica de Piloto Privado. Esta política explica de forma transparente que dados coletamos, por que coletamos e como você pode exercer seus direitos previstos na **LGPD — Lei 13.709/2018**.

### 1. Controlador de dados

| | |
|---|---|
| Responsável | Capitão Lorí (projeto independente) |
| Contato | privacidade@capitaolori.app |
| Encarregado (DPO) | dpo@capitaolori.app |

### 2. Que dados coletamos

Coletamos apenas o que é necessário para o app funcionar e melhorar a experiência de estudo. **Não vendemos seus dados. Não usamos para publicidade dirigida.**

#### 2.1 Dados de conta
- **E-mail** — necessário para autenticação.
- **Senha** — armazenada com hash bcrypt no Supabase Auth; nunca temos acesso ao texto puro.
- **Username** (opcional) — exibido no ranking semanal das ligas.

#### 2.2 Dados de uso e progresso de estudo
- Lições concluídas, XP acumulado, ofensiva diária, vidas, badges.
- Tentativas de questões (resposta escolhida, acerto/erro, data).
- Resultados de simulados (pontuação por matéria, aprovação).

#### 2.3 Dados técnicos
- Informações da sessão (token JWT do Supabase, cookies de autenticação).
- Endereço IP no momento da autenticação (anti-fraude, retido por 90 dias).
- User agent do navegador para detectar problemas.

#### 2.4 O que NÃO coletamos
- Geolocalização precisa.
- Contatos, fotos, calendário.
- Dados de saúde, finanças ou de menores de idade.
- Identificadores únicos de dispositivo para publicidade.

### 3. Bases legais (LGPD art. 7º)

| Finalidade | Base legal |
|---|---|
| Operação da conta e progresso | Execução de contrato (você aceita os Termos) |
| Anti-fraude (IP, dispositivos) | Legítimo interesse |
| Comunicações operacionais | Execução de contrato |
| Métricas anônimas agregadas | Legítimo interesse |

### 4. Compartilhamento

Compartilhamos dados estritamente com prestadores de serviço operadores:

- **Supabase Inc.** (banco de dados, autenticação) — servidores em São Paulo, Brasil. Contrato com cláusulas de proteção LGPD/GDPR.
- **Vercel Inc.** (hospedagem da camada web) — termos com cláusulas SCC.

Nenhum dado é repassado a anunciantes ou intermediários.

### 5. Retenção

| Dado | Tempo |
|---|---|
| Conta e progresso | Enquanto a conta existir; deletado em até 30 dias após exclusão |
| IP de autenticação | 90 dias |
| Logs do servidor | 30 dias |
| Dados anonimizados (estatísticas) | Indefinido |

### 6. Seus direitos (LGPD art. 18)

Você pode, a qualquer momento:

- **Confirmar** o que armazenamos.
- **Acessar** seus dados (exportação JSON sob demanda).
- **Corrigir** dados incorretos.
- **Anonimizar / bloquear / deletar** dados desnecessários ou excessivos.
- **Portar** seus dados para outro serviço.
- **Revogar consentimento** e excluir a conta.

Para exercer qualquer direito, envie e-mail para **privacidade@capitaolori.app**. Respondemos em até 15 dias.

### 7. Segurança

- Conexões HTTPS/TLS 1.2+ em todo o tráfego.
- Senhas: bcrypt no Supabase Auth.
- Row-Level Security (RLS) no banco — cada usuário só lê os próprios dados.
- Backups diários do banco com retenção de 7 dias.
- Não temos acesso à sua senha em texto puro nem ao token de sessão depois que você sai.

### 8. Crianças e adolescentes

O app é destinado a maiores de **13 anos**. Não coletamos dados conscientemente de crianças menores. Se você é responsável e detectou cadastro indevido, escreva para nós.

### 9. Alterações

Mudanças relevantes nesta política são comunicadas com 30 dias de antecedência por e-mail e dentro do app.

### 10. Reclamações à ANPD

Se entender que houve violação, você pode reclamar à **Autoridade Nacional de Proteção de Dados** — https://www.gov.br/anpd.

---

> **Importante:** Capitão Lorí não é filiado, endossado ou patrocinado pela **ANAC**. Material educacional baseado em fontes públicas (RBAC, ICA, MCA, AIP-Brasil). Sempre consulte os manuais oficiais antes de operar.`;

export default function PrivacyPage() {
  return (
    <article className="card-pop p-8">
      <Markdown content={CONTENT} />
    </article>
  );
}
