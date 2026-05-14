# Auth — configuração de OAuth + biometria

Este projeto suporta três caminhos de login:

| Método | Status do código | Configuração externa necessária |
|---|---|---|
| Email + senha | Pronto | Já em produção |
| Google Sign-In | Pronto | Supabase Dashboard + Google Cloud Console |
| Apple Sign-In | Pronto | Supabase Dashboard + Apple Developer |
| Face ID / Touch ID | Pronto | Build nativo via `cap sync` |

Os botões "Continuar com Google/Apple" já aparecem em `/login` e `/signup`.
Eles só vão funcionar **depois** de você completar a configuração abaixo.

---

## 1. Google OAuth — passo a passo

1. Acesse [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. **Create credentials → OAuth client ID → Web application**.
3. Em **Authorized redirect URIs**, adicione exatamente:
   ```
   https://<SEU_PROJETO>.supabase.co/auth/v1/callback
   ```
   Substitua `<SEU_PROJETO>` pelo subdomínio do seu Supabase (ex.: `ggveduxfkljidzkrmmoo`).
4. Salve. O console mostrará `Client ID` e `Client secret`.
5. Vá ao [Supabase Dashboard → Authentication → Providers → Google](https://supabase.com/dashboard/project/_/auth/providers).
6. Habilite Google, cole `Client ID` + `Client secret`, salve.
7. Em **Authentication → URL Configuration**, garanta que `Site URL` é
   `https://fligth.vercel.app` e que **Redirect URLs** inclui:
   - `https://fligth.vercel.app/callback`
   - `https://fligth-*.vercel.app/callback` (previews)
   - `capacitor://localhost/callback` (Capacitor iOS)
   - `http://localhost:*/callback` (dev)

Pronto. O botão "Google" no `/login` agora redireciona via
`signInWithOAuth({ provider: 'google' })` para o Supabase, que faz o
round-trip com a Google e devolve o usuário em `/callback`, que troca o
code por uma sessão.

---

## 2. Apple Sign-In — passo a passo

> **Importante.** A App Store Review Guideline 4.8 exige Sign in with Apple
> sempre que o app oferece outras opções de login OAuth (Google etc).
> Sem Apple Sign-In configurado, a build pode ser rejeitada.

### 2.1 No Apple Developer Account

1. Em [identifiers](https://developer.apple.com/account/resources/identifiers/list), abra o **App ID** `br.com.capitaolori.app`.
2. Em **Capabilities**, habilite **Sign In with Apple**. Salve.
3. Volte para identifiers → **Services IDs** → crie um novo:
   - Description: `Capitao Lori Web`
   - Identifier: `br.com.capitaolori.web`
   - Habilite **Sign In with Apple** → **Configure**:
     - Primary App ID: o App ID acima.
     - Domains and Subdomains: `<SEU_PROJETO>.supabase.co`
     - Return URLs: `https://<SEU_PROJETO>.supabase.co/auth/v1/callback`
   - Save.
4. Em **Keys**, crie uma nova chave com a capability **Sign In with Apple**.
   - Configure → escolha o App ID principal → Save.
   - **Baixe o .p8** (só baixa uma vez). Anote também o **Key ID** (10 chars).
5. Anote também o **Team ID** (no canto superior direito da conta).

### 2.2 No Supabase Dashboard

1. [Auth → Providers → Apple](https://supabase.com/dashboard/project/_/auth/providers) → habilite.
2. **Service ID**: `br.com.capitaolori.web` (o Services ID criado, NÃO o App ID).
3. **Team ID**: o Team ID do passo 5 acima.
4. **Key ID**: o Key ID do passo 4.
5. **Secret Key**: cole o conteúdo INTEIRO do `.p8` (incluindo `-----BEGIN PRIVATE KEY-----` e fim).
6. Save.

### 2.3 Native vs Web

A implementação atual usa `signInWithOAuth({ provider: 'apple' })` que abre
um fluxo web. Funciona dentro do WebView do Capacitor. Mais tarde, para
uma UX nativa "Sign in with Apple" estilo iOS (com o botão preto oficial e
sheet integrado), seria necessário o plugin
[`@capacitor-community/apple-sign-in`](https://github.com/capacitor-community/apple-sign-in)
+ trocar para `supabase.auth.signInWithIdToken({ provider: 'apple', token })`.
Por enquanto o flow web é suficiente para passar Review.

---

## 3. Capacitor — redirect & WebView

O `capacitor.config.ts` já permite navegar para `*.supabase.co` e domínios
Vercel. Confira após edits que esses entries seguem em `server.allowNavigation`:

```ts
allowNavigation: [
  "*.supabase.co",
  "*.supabase.in",
  "*.vercel.app",
  "fligth.vercel.app",
  // (necessário para OAuth Google)
  "accounts.google.com",
  "*.googleusercontent.com",
  // (necessário para OAuth Apple)
  "appleid.apple.com",
]
```

> Se OAuth abrir mas voltar com erro de "redirect uri not allowed", revise a
> lista de Redirect URLs no Supabase (passo 1.7) e a allowlist do Capacitor.

---

## 4. Face ID / Touch ID

Implementação local-only:

- Plugin: `@aparajita/capacitor-biometric-auth`
- `Info.plist` ganhou a chave **`NSFaceIDUsageDescription`** com copy em PT-BR.
- Após primeiro login bem-sucedido no app nativo, o usuário vê o banner
  `BiometricEnrollPrompt` ("Use Face ID na próxima vez?"). Opt-in seta
  `localStorage.capitao-lori.biometric-enabled = "1"`.
- Em todo boot do app, `BiometricGate` (no `app/layout.tsx`) checa:
  - É Capacitor nativo?
  - Tem sessão Supabase válida no storage?
  - O flag de opt-in está ligado?
  - Se sim → bloqueia a UI com tela de Face ID até o usuário autorizar.
  - Falhou ou cancelou → "Entrar com senha" sai da conta e volta a `/login`.

> A sessão do Supabase persiste sozinha em `localStorage` do WebView (sobrevive
> a launches). O Face ID é apenas a camada de **re-autenticação** por cima —
> não estamos guardando tokens no Keychain. Para esse plus de segurança,
> integraríamos `@capacitor/preferences` com `accessibility:
> SecureStorage`, mas não é necessário pra ANAC PPA atual.

### Rebuild necessário

Sempre que o plugin nativo for instalado/atualizado:

```bash
npm install
npx cap sync ios
# (no Xcode) Product → Clean Build Folder → Archive
```

O CI workflow `.github/workflows/ios-pr-build.yml` faz isso automaticamente
em PRs que tocam `ios/**` ou `package.json`.

---

## 5. Smoke test

Depois de configurar Google + Apple no Supabase:

1. Em `https://fligth.vercel.app/login`, clique **Google** → autorize → cai em `/learn`.
2. Em `/login`, clique **Apple** → autorize → cai em `/learn`.
3. Faça logout, repita o login com Google e desta vez confirme que o banner
   `BiometricEnrollPrompt` NÃO aparece (web não tem biometria).
4. Na build nativa (TestFlight), faça login com email/senha →
   `BiometricEnrollPrompt` aparece → "Ativar" → confirma Face ID.
5. Mate o app e reabra → vê a tela de lock com mascote feliz → Face ID →
   destrava direto sem digitar nada.
