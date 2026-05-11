# CI iOS — build automático no GitHub, sem abrir o Xcode

Cada push em `main` (que toque `ios/`, `capacitor.config.ts`, `package.json` ou `fastlane/**`) dispara um runner **macos-14** do GitHub Actions que:

1. Faz `npm ci` + `npm run mobile:sync`
2. Sobe o Bundler + Cocoapods
3. Roda `fastlane ios beta`:
   - Fetcha certs e provisioning profiles via **match**
   - Incrementa `CFBundleVersion` = `(último build no TestFlight) + 1`
   - Build em **Release** + assina + exporta `.ipa`
   - Sobe para o TestFlight da `App Store Connect`
4. TestFlight processa o build (10-20 min)
5. Você instala via TestFlight no iPhone

Zero Xcode. Você só precisa de **1 setup inicial de ~10 minutos**.

---

## Setup inicial (uma vez)

### A) Criar a App no App Store Connect

Sem isso o `upload_to_testflight` não tem alvo.

1. https://appstoreconnect.apple.com → **My Apps → + → New App**.
2. Platforms: iOS · Name: `Capitão Lorí — Piloto` · Primary Language: Portuguese (Brazil) · Bundle ID: `br.com.capitaolori.app` · SKU: `capitaolori-001` · Full Access · **Create**.

### B) Criar App Store Connect API Key (P8)

Substitui o login Apple ID por uma chave de longa duração — o jeito moderno e recomendado pela Apple.

1. https://appstoreconnect.apple.com/access/integrations/api → **App Store Connect API → Keys → Generate API Key**.
2. Name: `Capitao Lori CI` · Access: **App Manager** → Generate.
3. **Baixe o arquivo `.p8`** (só dá pra baixar uma vez!).
4. Anote:
   - **Key ID** (10 caracteres, ex: `ABC123DEFG`)
   - **Issuer ID** (UUID, ex: `12345678-abcd-...`)
   - O conteúdo do `.p8` (texto começando com `-----BEGIN PRIVATE KEY-----`)

### C) Pegar o Team ID

https://developer.apple.com/account → **Membership** → copia o **Team ID** (10 caracteres, ex: `12ABCD3456`).

### D) Criar o repo privado para o match (signing certs/profiles)

Match guarda certs e profiles **criptografados** num repo Git privado seu. Boa prática mesmo: nunca commitar certs no repo do app.

1. Crie no GitHub um repo privado vazio: `capitaolori-certs`.
2. No seu Mac (uma vez só):
   ```bash
   cd ~/Fligth
   gem install fastlane cocoapods   # ou `bundle install` se preferir
   export APP_STORE_CONNECT_KEY_ID=...           # da etapa B
   export APP_STORE_CONNECT_ISSUER_ID=...
   export APP_STORE_CONNECT_KEY="$(cat /caminho/da/sua/AuthKey_XXXXXX.p8)"
   export APPLE_TEAM_ID=...                       # da etapa C
   export MATCH_GIT_URL="https://github.com/SEU_USER/capitaolori-certs.git"
   export MATCH_PASSWORD="senha-forte-pra-cifrar-certs"  # guarde em 1Password
   bundle exec fastlane match appstore
   ```
   Na primeira execução, o match:
   - Cria um App ID na Apple (se não existir)
   - Cria um Distribution Certificate
   - Cria um Provisioning Profile para `App Store` distribution
   - Criptografa tudo com `MATCH_PASSWORD` e dá push pro `capitaolori-certs`
3. **Guarde a `MATCH_PASSWORD`** — sem ela ninguém consegue descriptografar os certs.

### E) Gerar GitHub PAT para o runner acessar o repo de certs

O runner precisa ler `capitaolori-certs`. A forma mais simples:

1. https://github.com/settings/tokens → **Generate new token (fine-grained)**.
2. Resource owner: você. Expiration: 1 ano.
3. Repository access: **Only select repositories** → marca `capitaolori-certs`.
4. Permissions: **Contents: Read** (suficiente, porque CI roda `match` em readonly).
5. Generate → copia o `github_pat_...`.
6. Calcule o **Basic auth header**:
   ```bash
   echo -n "SEU_USER:github_pat_..." | base64
   ```
   O resultado é o `MATCH_GIT_BASIC_AUTHORIZATION`.

### F) Configurar GitHub Secrets do repo Fligth

https://github.com/KallebyX/Fligth/settings/secrets/actions → **New repository secret** para cada um:

| Secret | Valor |
|---|---|
| `APP_STORE_CONNECT_KEY_ID` | Key ID (10 chars) — etapa B |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID (UUID) — etapa B |
| `APP_STORE_CONNECT_KEY` | Conteúdo cru do `.p8` (com `-----BEGIN PRIVATE KEY-----`). Cola tudo no Value. |
| `APP_STORE_CONNECT_KEY_IS_BASE64` | `false` |
| `APPLE_TEAM_ID` | Team ID — etapa C |
| `MATCH_GIT_URL` | URL HTTPS do repo de certs |
| `MATCH_PASSWORD` | A senha de cifra que você definiu na etapa D |
| `MATCH_GIT_BASIC_AUTHORIZATION` | Base64 calculado na etapa E |
| `MATCH_KEYCHAIN_PASSWORD` | Qualquer string aleatória (usado no keychain temporário do runner) |

### G) Disparar o primeiro build

Manual (recomendado pro primeiro):

```
https://github.com/KallebyX/Fligth/actions/workflows/ios-testflight.yml
→ Run workflow → branch main → Run
```

Ou commit qualquer em `ios/**` ou `fastlane/**` (já basta atualizar um comment). O runner sobe em segundos.

Logs em tempo real → você acompanha do GitHub. Demora ~15 min na primeira vez (Pods + Archive).

Quando termina: 5-10 min depois o build aparece em **App Store Connect → TestFlight → Builds** com status `Processing` → `Ready to Submit`.

---

## Iterações seguintes

Daí pra frente:

- Mudou só o web app? Não precisa rebuildar iOS — o WebView do app nativo carrega o `https://fligth.vercel.app` ao vivo.
- Mudou plugin Capacitor ou config nativa? Workflow roda sozinho no próximo push.
- Quer manualmente disparar mesmo sem mudança? `Run workflow` no GitHub.

---

## Troubleshooting comum

| Erro | Causa | Fix |
|---|---|---|
| `Could not find any artifacts for this app` | App ainda não criada no ASC | Volta na etapa A |
| `Invalid API Key` | P8 mal copiado ou Key ID errado | Refaz B, confere `-----BEGIN`/`END` no Secret |
| `Couldn't decrypt the repo` | `MATCH_PASSWORD` errado | Usa exatamente a senha da etapa D |
| `No matching profiles found` | App ID não existe na Apple ainda | Roda `fastlane match appstore --readonly false` no Mac uma vez |
| `Build version already exists` | Tentou subir mesmo build duas vezes | O lane `bump_build` resolve — ele lê o último TestFlight build e incrementa. Roda de novo. |
| `Pod install failed` | Cache de Pods stale | `cd ios/App && pod repo update && pod install`; commita o Podfile.lock |
| Runner está demorando muito | macos-14 frio | Normal: ~15 min primeira vez, ~8 min depois |

---

## Submeter para App Review (lançamento público)

Quando estiver feliz com a build no TestFlight:

```bash
# No Mac:
bundle exec fastlane submit_for_review
```

Ou pelo App Store Connect → seu app → App Store → **+ Version** → preencha screenshots + descrição (cola do `store/app-store/listing.pt-BR.md`) → **Submit for Review**. Apple responde em 24-72h.

---

## Custos GitHub Actions

- macOS runners contam **10x** comparado a Linux: 1 min de macos-14 = 10 min do quota.
- Free plan: 2000 min Linux/mês = **200 min macOS/mês**.
- Build típico: ~10 min macOS = 100 min de quota = **20 builds/mês free**.
- Pro plan ($4/mês): 3000 min/mês = 30 builds/mês free, depois $0.08/min macOS.

Pra estagio de validação inicial está OK. Quando o app estiver vendendo bem e for releasing semanal, considera Xcode Cloud (US$ 14,99/mês, 100h de compute incluídas).
</thinking>

## 4) `.gitignore` para artefatos do Fastlane

<function_calls>
<invoke name="Read">
<parameter name="file_path">/home/user/Fligth/.gitignore