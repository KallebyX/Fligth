# Fastlane — Comandante Lorí iOS

Lanes:

| Lane | O que faz |
|---|---|
| `prepare` | `npm run mobile:sync` + `pod install` |
| `certs` | Fetcha/atualiza certs e profiles via `match` |
| `bump_build` | Incrementa `CFBundleVersion` para `latest TestFlight + 1` |
| `beta` | Pipeline completo: prepare → certs → bump → archive → upload TestFlight |
| `submit_for_review` | Submete a build mais recente do TestFlight para App Review |

Variáveis de ambiente esperadas (vêm dos GitHub Secrets em CI ou de um
`.env.fastlane.local` no Mac):

```
APP_STORE_CONNECT_KEY_ID
APP_STORE_CONNECT_ISSUER_ID
APP_STORE_CONNECT_KEY              # conteúdo do .p8 OU base64 do .p8
APP_STORE_CONNECT_KEY_IS_BASE64    # "true" se acima for base64
APPLE_TEAM_ID                      # ABCDE12345
MATCH_GIT_URL                      # https://github.com/USER/capitaolori-certs.git
MATCH_PASSWORD                     # senha de cifra do match
MATCH_GIT_BASIC_AUTHORIZATION      # base64 de "user:pat" pro repo privado (CI)
TESTFLIGHT_CHANGELOG               # opcional
```

Veja `mobile/CI-IOS.md` para o setup inicial (criação da API Key + match repo + GitHub Secrets).
