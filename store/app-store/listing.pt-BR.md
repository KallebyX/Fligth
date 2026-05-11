# App Store Connect — Capitão Lorí (pt-BR)

> Cole estes blocos nos respectivos campos do **App Information** + **Version Information** em https://appstoreconnect.apple.com.

---

## Nome (até 30 caracteres)

```
Capitão Lorí — Piloto
```

## Subtítulo (até 30 caracteres)

```
Estudo para a teórica ANAC
```

## Promo Text (até 170 caracteres — atualizável sem submissão)

```
Lições curtas, ofensiva diária, simulado no formato da banca e mascote aviador. Estude 5 min por dia e aprove na teórica de Piloto Privado.
```

## Descrição (até 4000 caracteres)

```
Capitão Lorí é o seu copiloto de bolso para a prova teórica de Piloto Privado de Avião (PPA).

✈ ESTUDE 5 MINUTOS POR DIA
Lições curtinhas, no estilo Duolingo. Sem aula gravada de 3 horas — você abre o app, faz 8 perguntas, ganha XP e segue.

🔥 OFENSIVA DIÁRIA
Você mantém uma sequência de dias estudando. Pular um dia? Use um congelamento. A constância é o que aprova.

❤ 5 VIDAS QUE REGENERAM
Errar custa um coração. Você recupera 1 a cada 30 minutos. Sem castigo eterno — só treino.

🧠 REVISÃO ESPAÇADA (SM-2)
As questões que você erra voltam no momento certo (1 dia, 6 dias, 14 dias…). É como o seu cérebro REALMENTE memoriza.

📝 SIMULADO NO FORMATO DA BANCA
100 questões, 20 por matéria, 3 horas de prova, aprovação só com 70% em CADA disciplina. Treine antes da prova real.

🏆 LIGAS SEMANAIS
Bronze, prata, ouro, diamante. Top 10 sobem, bottom 5 caem. Competição saudável com outros pilotos em formação.

📚 AS 5 MATÉRIAS COBERTAS
• Regulamentos de Tráfego Aéreo
• Meteorologia
• Navegação Aérea
• Teoria de Voo
• Conhecimentos Técnicos

Todas mapeadas em lições com explicações, referência regulatória (RBAC, ICA, MCA, AIP-Brasil) e nível de dificuldade.

🦜 MASCOTE CAPITÃO LORÍ
Um papagaio aviador que comemora quando você acerta e fica triste quando você erra. Porque estudar deveria ser divertido.

———

⚠ Importante: Capitão Lorí é um projeto independente de estudo. NÃO é filiado, endossado ou patrocinado pela ANAC. O conteúdo é educativo e não substitui os manuais oficiais nem instrução de voo certificada. Sempre consulte as fontes oficiais da agência reguladora antes de operar.

Política de privacidade: https://fligth.vercel.app/privacy
Termos de uso: https://fligth.vercel.app/terms
Suporte: suporte@capitaolori.app
```

## Keywords (até 100 caracteres, separadas por vírgula)

```
anac,piloto,ppa,aviação,prova teórica,simulado,piloto privado,meteorologia,navegação aérea
```

## Support URL

```
https://fligth.vercel.app/support
```

## Marketing URL

```
https://fligth.vercel.app
```

## Privacy Policy URL

```
https://fligth.vercel.app/privacy
```

## Categoria

- **Primary:** Education
- **Secondary:** Reference

## Faixa etária (Age Rating)

- **4+** (nenhum conteúdo restrito)

## Privacy Nutrition Labels

| Tipo de dado | Coletado? | Vinculado à identidade | Usado para rastreio |
|---|---|---|---|
| Contact Info — Email | Sim | Sim | Não |
| Contact Info — Name | Sim (username opcional) | Sim | Não |
| Identifiers — User ID | Sim | Sim | Não |
| Usage Data — Product Interaction | Sim | Sim | Não |
| Diagnostics — Crash Data | Não | — | — |
| Location | **Não** | — | — |
| Sensitive Info | **Não** | — | — |
| Financial Info | **Não** | — | — |
| Health & Fitness | **Não** | — | — |

## Build Notes (para o revisor da Apple)

```
This is a thin native shell (Capacitor 8 + WebView) around a Next.js
educational app deployed at https://fligth.vercel.app.

Server-side rendering, authentication and content live on Vercel/Supabase.
No tracking SDKs, no third-party ads.

To test: create a free account on the signup screen with any email. The full
gameplay loop (lessons, simulated exam, leagues) is available without any
in-app purchase. There are no paid tiers at this version.

Demo credentials are not required.
```

## Screenshots (preparar antes do envio)

- **iPhone 6.7"** (iPhone 15 Pro Max — 1290×2796) — obrigatório, mínimo 3, recomendado 6.
- **iPhone 6.5"** (iPhone 11 Pro Max — 1242×2688) — obrigatório, mesma quantidade.
- **iPhone 5.5"** (iPhone 8 Plus — 1242×2208) — opcional mas aconselhado.
- **iPad Pro 12.9"** (2048×2732) — obrigatório se app suporta iPad. Hoje suporta orientação retrato em iPad.

**Sequência sugerida:**
1. Landing (mascote + título "Estude pra Piloto Privado em 5 min/dia").
2. Mapa de trilhas com 5 matérias.
3. Player de uma questão (com explicação).
4. Tela de "Lição concluída" com XP/confete.
5. Resultado do simulado (aprovado).
6. Ranking semanal.

Gere com [Mockuuups Studio](https://mockuuups.studio) ou Figma. Mantenha o azul `#0EA5E9` de fundo.
