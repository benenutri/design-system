# Plataforma Mitra — o que um projeto precisa saber

Leia quando for desenhar tabelas, Server Functions, permissões ou o transporte
do frontend. Tudo aqui foi verificado nos projetos p-45547, p-56555, p-57803 e
p-45654 e nos READMEs de `mitra-sdk@1.0.62` / `mitra-interactions-sdk@1.0.42`.

## 1. Modelo

Um **projeto Mitra** (id numérico, `MITRA_PROJECT_ID`) é:

| Recurso | O que é | Quem provisiona |
|---|---|---|
| Banco do projeto | MySQL do tenant (JDBC `1`), tabelas em CAIXA_ALTA | `runDdlMitra` em `setup-backend.mjs` |
| Server Functions (SF) | código executado na plataforma, identificado por **id numérico** | `createServerFunctionMitra` em `add-NNN-*.mjs` |
| Usuários e perfis | `INT_USER` + perfis com permissões de SF/tabela/tela | `manageUserAccessMitra`, `createProfileMitra`, `setProfile*Mitra` |
| JDBC externos | conexões a outros bancos (ex.: Oracle WinThor = JDBC `3` no SGC) | `createJdbcConnectionMitra` |
| Integrações | conectores nomeados (`runQuery` numa conexão, ex. `gestao-de-custos`) | `createIntegrationMitra` |
| Crons | SF com `cronExpression` (6 campos: `'0 */30 * * * *'`) | campo da própria SF |
| E-mail | `sendEmailMitra({ projectId, to[], subject, body(html) })` | chamado de dentro de SF JAVASCRIPT |
| Frontend | build estático (Vite) servido pela plataforma em subpath (`base: './'`) | o sandbox faz o build |

Não há servidor próprio: o runtime são as SFs. O repositório guarda o frontend
e os **scripts** que descrevem o backend; o backend em si vive na plataforma.

## 2. Os dois SDKs

| | `mitra-sdk` | `mitra-interactions-sdk` |
|---|---|---|
| Onde | `backend/` (Node, scripts de provisionamento) e dentro de SF JAVASCRIPT via `require('mitra-sdk')` | `frontend/` (browser) |
| Token | `MITRA_TOKEN` (usuário dev, vem do `.env` do sandbox) | sessão do usuário final (JWT no fragment) |
| Faz | DDL/DML, criar/atualizar SF, perfis, JDBC, crons, e-mail, arquivos | `executeServerFunctionMitra`, login, refresh |
| Nunca | importar no frontend (token dev vazaria no bundle) | `fetch`/`axios` replicando o SDK |

Configuração (backend):

```js
import 'dotenv/config';
import { configureSdkMitra } from 'mitra-sdk';
configureSdkMitra({
  baseURL: process.env.MITRA_BASE_URL,
  token: process.env.MITRA_TOKEN,
  integrationURL: process.env.MITRA_BASE_URL_INTEGRATIONS,
});
const projectId = Number(process.env.MITRA_PROJECT_ID);
```

Funções do `mitra-sdk` mais usadas (todas recebem `{ projectId, ... }` e
devolvem `{ status, result }`):

- SQL: `runQueryMitra({ sql, jdbcId? })` (só SELECT) · `runDdlMitra` · `runDmlMitra`
- SF: `listServerFunctionsMitra` → `result[{ id, name, type, jdbcId, cronExpression? }]` ·
  `createServerFunctionMitra({ name, code, type, description?, jdbcId?, cronExpression?, cronInputJson? })` → `result.serverFunctionId` ·
  `updateServerFunctionMitra({ serverFunctionId, ... })` · `deleteServerFunctionMitra` ·
  `readServerFunctionMitra` · `togglePublicExecutionMitra({ serverFunctionId, publicExecution })`
- Tabelas: `listTablesMitra` → `result[{ name, columns[{ name, type, isPk, nullable }] }]`
- Usuários: `listProjectUsersMitra` → `result[{ userId, name, email, profile, userType }]` ·
  `manageUserAccessMitra({ email, action: 'INVITE'|'REMOVE'|'CHANGE_TYPE', type: 'dev'|'business' })`
- Perfis: `listProfilesMitra`, `createProfileMitra({ name })`, `setProfileUsersMitra({ profileId, userIds?|emails? })`,
  `setProfileServerFunctionsMitra({ profileId, serverFunctionIds })`,
  `setProfileSelectTablesMitra({ profileId, jdbcConnectionConfigId: 1, tables: [{ tableName }] })`
- JDBC: `listJdbcConnectionsMitra`, `createJdbcConnectionMitra({ name, type, host, port, database, user, password })`
- Outros: `sendEmailMitra`, `listProjectFilesMitra`, `uploadFilePublicMitra`, `createDataLoaderMitra`,
  `createOnlineTableMitra`, `updateProjectSettingsMitra`, `updateAdditionalInstructionsMitra`

Frontend (`mitra-interactions-sdk`):

```ts
configureSdkMitra({ baseURL, token, projectId, authUrl, integrationURL?, onTokenRefresh });
const res = await executeServerFunctionMitra({ projectId, serverFunctionId, input });
```

`authUrl` de produção: `https://coder.mitralab.io/sdk-auth/`. Em 403 o SDK
tenta refresh por iframe e chama `onTokenRefresh(session)`. `loginMitra('email'|'google'|'microsoft'|'mitra', { mode: 'popup'|'redirect' })`
devolve `{ token, baseURL, integrationURL? }` e no redirect o token chega no
**fragment** `#tokenMitra=...&backURLMitra=...&integrationURLMitra=...` — é
isso que `initMitra()` consome (e o que o mitra-hub reproduz).

## 3. Server Functions

| Tipo | `code` é | Roda em | Uso |
|---|---|---|---|
| `SQL` | uma instrução SQL (MySQL) | JDBC `jdbcId` (default `1`, o banco do projeto; outro id = banco externo) | leitura paginada e **escrita de usuário business** |
| `JAVASCRIPT` | corpo de função async; tem `event` (input), `require('mitra-sdk')`, `process.env` | plataforma | regra com validação, orquestração, e-mail |
| `INTEGRATION` | SQL enviado a uma integração nomeada | conector | dados fora dos JDBCs |

### Parâmetros

- SF SQL recebe `{{nome}}`. A plataforma **substitui por texto antes do parse**
  e liga o valor como parâmetro. Consequências:
  - string precisa de aspas manuais: `WHERE NOME = '{{nome}}'`;
  - numérico ausente vira `COL = ` (erro de sintaxe) → **filtro desligado é
    `''` no texto e `0` no número**, e o frontend manda todos os campos sempre:
    `AND ({{municipioId}} = 0 OR A.MUNICIPIO_ID = {{municipioId}})`,
    `AND ('{{busca}}' = '' OR P.NOME LIKE CONCAT('%', '{{busca}}', '%'))`;
  - opcional em escrita: `NULLIF('{{x}}', '')` para texto, `NULLIF({{x}}, 0)` para id,
    `({{x}} = 1)` para booleano;
  - **não escape** o valor no frontend (o escape seria gravado) — mas limite
    tamanho e remova o que não deve entrar.
- `:VAR_USER` é o `INT_USER.ID` de quem chama. Identidade vem daí, nunca de
  e-mail no input: `WHERE U.EMAIL = (SELECT IU.DESCR FROM INT_USER IU WHERE IU.ID = :VAR_USER)`.
- `:var`, `?` e `${}` **não funcionam** em SF SQL.
- No frontend o campo é `input:`; com `params:` o SDK ignora em silêncio.

### Retorno

```
{ result: { executionStatus: 'COMPLETED' | 'FAILED' | 'CANCELLED', serverFunctionId, output, error } }
```

`output` pode ser objeto, **string JSON** ou embrulhado (`{ rows }`, `{ result }`,
`{ body: { rows } }`). Colunas SQL chegam em **UPPERCASE** (`row.NOME`).
Normalize num lugar só (`mitra-api.ts` do kit: `linhas()` / `acao()`).

### JAVASCRIPT chamando outras SFs

De dentro de uma SF JS, `executeServerFunctionMitra({ projectId, serverFunctionId, input })`
chama outra por **id**. O id só existe depois de publicar, então:
o corpo carrega um marcador (`__IDS__`), o script de publicação publica primeiro
as SFs chamadas, troca o marcador pelo mapa real e só então publica a JS. O
simulador faz a mesma troca com os ids locais. (`p-57803/backend/lib/escritas.mjs`
+ `injetarIds()` é a referência completa.)

## 4. Permissões

- `userType`: `dev` (equipe, token do `.env`) e `business` (usuário final).
- Para **business**: CRUD REST (`listRecordsMitra`, `createRecordMitra`,
  `patchRecordMitra`…) responde **403**; `runDmlMitra` de dentro de SF JS
  **herda o bloqueio** (`BUSINESS_ACCESS_DENIED`). O caminho de escrita é
  **SF SQL** (uma instrução por SF); a JS valida com `runQueryMitra` e chama a
  SQL por id.
- Business sem perfil recebe **400 "User has no profile assigned"**. Todo
  projeto precisa de um script `add-NNN-perfil-acesso.mjs` que cria/reaproveita
  um perfil, libera SFs e tabelas de leitura e coloca os usuários nele
  (`p-57803/backend/add-004-perfil-acesso.mjs`). Quem corta o que cada pessoa
  vê é o próprio app, por uma coluna de perfil de negócio.
- Formulário público (sem login): `togglePublicExecutionMitra` na SF de load/submit.

## 5. Limites e desempenho

- **300 execuções de SF por minuto para o projeto inteiro** (todos os usuários);
  estourar degrada 300→150→50 por um minuto. Logo: polling unificado ≥ 60 s,
  consolidar eventos, KPIs por função analítica na mesma query, resolver
  regras no cliente quando der.
- Execução síncrona tem timeout de 60 s; `executeServerFunctionAsyncMitra` +
  `getServerFunctionExecutionMitra` para o resto.
- Toda listagem com volume variável tem `LIMIT/OFFSET` (20–50 por página) e uma
  SF irmã `...Total` com os mesmos filtros.
- Blocos independentes com `Promise.allSettled`; uma falha não derruba a tela.

## 6. Modelagem no banco do projeto

- MySQL. `ID INT AUTO_INCREMENT PRIMARY KEY`; nomes de tabela/coluna em
  CAIXA_ALTA sem acento; `INDEX`, `UNIQUE KEY` e `FOREIGN KEY` inline funcionam.
- Datas em `VARCHAR(10)` (`AAAA-MM-DD`) ou `VARCHAR(19)` (`AAAA-MM-DDTHH:MM:SS`),
  **nunca** `DATE`/`TIMESTAMP` (o REST não deserializa). `DEFAULT CURRENT_TIMESTAMP`
  não funciona em VARCHAR: preencha no código (`new Date().toISOString().slice(0, 19)`).
- `BOOLEAN DEFAULT TRUE/FALSE` funciona.
- `INT_USER` é a tabela de usuários da plataforma: `ID`, `DESCR` (= e-mail),
  `NOME`, `ACCESS_LEVEL`. Não crie tabela própria de login; se o negócio tem
  perfis próprios, crie uma tabela de perfil que **case por e-mail** com
  `INT_USER` (ou por `MITRA_USER_ID` quando preenchido).
- Todo `CREATE` é `IF NOT EXISTS`; todo seed de negócio é guardado por SELECT
  — os scripts precisam ser idempotentes porque rodam mais de uma vez.

## 7. Migrations

- Todo DDL/SF/recurso executado via SDK **no sandbox** vira migration em
  `backend/migrations/` + `backend/migrations.yaml`, materializada e commitada
  pelo sistema **depois** do turno. Ninguém cria, edita, renumera ou faz
  `git add` nesses caminhos. Correção é sempre migration nova.
- Rodar o SDK **fora** do sandbox (máquina local) aplica em produção **sem
  migration**: o schema anda, a história não. Por isso o backend é escrito
  local e executado lá (ver `publicacao.md`).
- `mergeBaseline` / "Reconciliar Baseline" só com ordem explícita do usuário.
- Hook útil: `.claude/hooks/block-migrations.mjs` (p-45547) bloqueia Edit/Write
  nesses caminhos.

## 8. O que não funciona fora da plataforma

- Agent SDK (`getAgentTaskMitra`, `manageAgentChatMitra`…): depende de
  `window.__mitraEnv` injetado pelo build-proxy.
- `openChatMitra` / `closeChatMitra`: o sidebar é da plataforma.
- Login real exige `VITE_MITRA_AUTH_URL` + `VITE_MITRA_PROJECT_ID`; sem eles o
  app entra em modo local (simulador). O token de sessão trafega no fragment
  (`#`) de propósito — nunca mover para query string.
