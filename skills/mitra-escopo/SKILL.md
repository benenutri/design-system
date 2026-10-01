---
name: mitra-escopo
description: Escopa, estrutura, desenvolve localmente e publica projetos que rodam na plataforma Mitra (mitra-sdk no backend, mitra-interactions-sdk no frontend, Server Functions por id, simulador local em SQLite, sandbox que gera migrations). Use SEMPRE que o pedido envolver um projeto p-NNNNN, a pasta mitra-projects, "Mitra", "mitra-sdk", "server function", "simulador", "mitra-hub", "subir/publicar no Mitra", escopar/especificar uma feature ou sistema novo que vai rodar na Mitra, criar spec/plan/tasks, montar backend com setup-backend.mjs ou add-*.mjs, ou desenvolver frontend React que consome executeServerFunctionMitra — mesmo que o usuário não diga "Mitra" explicitamente mas o projeto tenha backend/ com mitra-sdk.
---

# Mitra — escopar, produzir local, subir para a plataforma

Esta skill captura o padrão dos projetos em `mitra-projects/` (SGC p-45547,
ITSM p-56555, CRM Ativa p-57803, Comercial 360 p-45654) para que um projeto
novo ou uma feature nova nasça do mesmo jeito: **spec antes de código, backend
escrito aqui e executado no sandbox, frontend rodando contra um simulador que
executa as mesmas Server Functions que vão para produção**.

## Que fluxo seguir

| O pedido é… | Fluxo | Leia também |
|---|---|---|
| "escopa/especifica X", "faz a spec de…", "o que precisa para…" | **A. Escopar** | `assets/templates/` |
| "cria um projeto novo para…", "monta a estrutura de…" | **A** depois **B. Projeto novo** | `references/estrutura-projeto.md` |
| "adiciona a feature Y no p-NNNNN", "implementa a spec 003" | **A** (se não há spec) depois **C. Feature** | `references/plataforma-mitra.md` |
| "roda local", "sobe o simulador", "testa no hub" | **D. Rodar local** | `references/simulador.md` |
| "sobe pro Mitra", "publica", "coloca em produção" | **E. Publicar** | `references/publicacao.md` |

Os fluxos encadeiam: uma feature completa é A → C → D → E.

## Modelo mental (leia uma vez)

- Um projeto Mitra = **tabelas MySQL + Server Functions (SF) + usuários/perfis**
  na plataforma, identificados por números (`MITRA_PROJECT_ID`, id da SF).
  Não há servidor próprio: o frontend chama SF por id com
  `executeServerFunctionMitra({ projectId, serverFunctionId, input })`.
- O repositório `p-NNNNN` tem `frontend/` (React 19 + Vite 7 + Tailwind 4) e
  `backend/` com **scripts** (`setup-backend.mjs`, `add-NNN-*.mjs`) que
  descrevem o backend com `mitra-sdk`. Os scripts são escritos aqui, mas só
  **rodam no sandbox da plataforma**, porque é lá que a migration é gerada.
- Localmente o frontend fala com `backend/simulator/`: um Mitra em SQLite que
  carrega as **mesmas `definitions`** dos `add-*.mjs` e o **mesmo DDL** do
  setup. Sem handler reimplementado: bug de SQL aparece aqui antes de publicar.
  `simulator/smoke.mjs` roda as SFs reais com `assert` e é **a suíte de
  testes do backend**; `frontend/tests/` cobre a regra pura da tela.
- **Testes são obrigatórios**, não opcionais: a spec lista o que cada cenário
  precisa provar, o plan mapeia para arquivo, as tasks têm uma task por teste,
  e nada é "pronto" sem `npm test` verde em `backend/` e em `frontend/`.
- Usuário final é `business`: CRUD REST dá 403, escrita só por SF SQL, e ele
  precisa de perfil. Teto de 300 SF/min por projeto. Colunas voltam em
  UPPERCASE. Detalhes e armadilhas: `references/plataforma-mitra.md`.

## Passo 0 — reconhecer o terreno (sempre)

Antes de propor qualquer coisa, olhe o que existe. Em 2 minutos:

1. Projeto existente? Leia `CLAUDE.md`, `README.md`, e descubra o layout de
   docs: `docs/specs/NNN-slug/{spec,plan,tasks}.md` (padrão atual) ou
   `.specs/` + `.agents/` (SGC). **Siga o layout do projeto**; não misture.
2. Liste `backend/*.mjs` e o mapa de SFs do frontend (`server-functions.ts`
   ou equivalente: `crm-server-functions.ts`, `SERVER_FUNCTIONS`…). Descubra
   o prefixo de nome das SFs (`crm`, `sgc`, `itsm`…) e o próximo NNN de spec.
3. Existe `backend/simulator/`? Qual porta? Está no `mitra-hub/server.mjs`?
4. Constitution/design system (`docs/constitution.md`, `docs/design.md`):
   são normativos; uma feature que os viola precisa registrar por quê.

Relate ao usuário em 3–5 linhas o que encontrou antes de escopar.

## Fluxo A — Escopar

Três artefatos, nesta ordem, cada um com uma pergunta própria. Copie de
`assets/templates/` para `docs/specs/NNN-slug/` (ou para o layout do projeto).

| Artefato | Responde | Proíbe |
|---|---|---|
| `spec.md` | o QUÊ e o PORQUÊ (problema, cenários Given/When/Then, RF/RNF com critério de aceite, regras, **testes exigidos por cenário**, **fora de escopo**) | qualquer menção a stack, tabela, SF, componente |
| `plan.md` | o COMO (checagem de princípios, modelo de dados, **contratos de backend** nome→tipo→params→saída, telas, simulador, **mapa de testes** cenário→arquivo→assert, decisões) | requisito novo |
| `tasks.md` | em que ORDEM (T-001…, backend → frontend → **testes** → verificação, rastreabilidade RF→tasks→teste) | decisão de design |

Como escopar bem neste contexto:

- **Entreviste o domínio, não a tecnologia.** Pergunte quem usa, com que
  frequência, o que dói hoje, o que "pronto" significa. Escreva cenários que
  uma pessoa do negócio consiga verificar sem ler código, com números.
- **Fora de escopo é obrigatório.** O que não está escrito como incluído está
  excluído — é o que evita a expansão silenciosa em cada turno de agente.
- **Ambiguidade vira `[NEEDS CLARIFICATION: pergunta]`** na spec e bloqueia o
  plan. Não adivinhe; liste as perguntas e siga com o que não depende delas.
- No `plan.md`, cada SF ganha **nome definitivo** (prefixo + domínio + ação),
  tipo (`SQL` para leitura paginada e escrita; `JAVASCRIPT` para regra com
  validação), parâmetros `{{x}}` com o valor de "desligado" (`''`/`0`) e as
  colunas de saída. Toda listagem tem `LIMIT/OFFSET` e uma SF `…Total`.
- No `plan.md`, seção **Simulador**: quais registros o seed precisa para cada
  cenário, quais parâmetros entram em `CHECK_INPUT`.
- **Testes nascem na spec e são obrigatórios.** A seção **Testes** da spec tem
  uma linha por cenário C-00N e regra RN-00N com a evidência concreta (entrada
  e resultado, com números) e a camada (regra de negócio ou regra de tela).
  O `plan.md` mapeia cada linha para `backend/simulator/smoke.mjs` ou
  `frontend/tests/<slug>.test.mjs` e diz o que o `assert` verifica. Spec sem
  essa seção preenchida **não é aprovada**; plan sem o mapa não vira tasks.
- Tasks são pequenas, citam arquivo e requisito, e incluem **uma task por
  teste** (T-08x). A verificação é `npm test` nos dois lados, `npm run build`
  e reproduzir manualmente só o que teste não cobre (layout, tema, navegação).
- Traga a lista de decisões abertas para o usuário **ao final do escopo**, não
  uma por vez no meio.

Quando a spec, o plan e as tasks estiverem escritos, pare e mostre ao usuário
um resumo (problema, cenários, SFs previstas, perguntas abertas) antes de codar
— a spec aprovada é o contrato do resto.

## Fluxo B — Projeto novo

1. Pasta `mitra-projects/p-NNNNN` (o id vem da plataforma; se ainda não
   existe, o usuário cria o projeto lá e o repositório em
   `github.com/mitra-agent-projects/p-NNNNN`). Se o id não é conhecido, use
   `p-novo-<slug>` e renomeie depois.
2. Frontend: `npm create vite@latest frontend -- --template react-ts`, Tailwind
   4 (`@tailwindcss/vite`), `react-router-dom`, `lucide-react`,
   `mitra-interactions-sdk`; `vite.config.ts` com `base: './'` e alias `@`.
   Copie `assets/frontend/*.ts` para `src/lib/` e `assets/frontend/tests/`
   para `frontend/tests/`; adicione `"test": "node --test \"tests/**/*.test.mjs\""`
   ao `package.json` (Node 22.18+ importa `.ts` direto; sem vitest). Crie
   `LoginPage` com o formulário do simulador em `MODO_LOCAL`. **Design system:** se o projeto é
   da Benenutri, invoque `/benenutri:design` (modo Instalar) — ele traz
   tokens, fontes, logos, primitivos e vocabulário de tela prontos. Para outro
   cliente, defina `docs/design.md` com tokens em `index.css` antes da
   primeira tela.
3. Backend: copie `assets/backend/` inteiro (setup, `add-001-funcoes.mjs`,
   sync, simulator com `smoke.mjs`, package.json com `sim:smoke` e `test`);
   `npm install`. Renomeie `add-001-funcoes.mjs` para `add-001-<slug>.mjs` e
   ajuste `PUBLISH_ORDER` e `package.json`.
4. Docs: `docs/templates/` ← `assets/templates/`; a primeira spec em
   `docs/specs/001-<slug>/`. Recomendado: `docs/constitution.md` (princípios
   do processo) e `docs/design.md` (o `/benenutri:design` fornece os
   dois para projetos da Benenutri).
5. Raiz: `README.md`, `CLAUDE.md` (← `assets/CLAUDE.md`, preenchido),
   `AGENTS.md` apontando para o CLAUDE.md, `.gitignore`, `.claude/launch.json`,
   `.env.example` de cada lado (← `assets/env/`).
6. Simulador: `config.mjs` (label, `SEED` = NNNNN, porta livre), `seed.mjs`
   com usuários e cenários; `npm run sim:check` verde.
7. Testes: troque os `teste()` de exemplo do `smoke.mjs` pelos cenários da
   spec 001 (um por linha da seção Testes do plan) e escreva os
   `frontend/tests/*.test.mjs` da regra de tela; `npm test` verde em
   `backend/` e em `frontend/`.
8. Registre no `mitra-hub/server.mjs` e no README do hub.

Entregue o esqueleto rodando no simulador, com `npm test` verde nos dois
lados, **antes** de começar as telas.

## Fluxo C — Feature em projeto existente

1. Spec aprovada (Fluxo A). Descubra o NNN e o prefixo de SF do projeto.
2. Schema: tabela nova no `setup-backend.mjs`; coluna nova em tabela existente
   → `ALTER TABLE` idempotente no `add-NNN` **e** a coluna no `CREATE` do setup.
3. `backend/add-NNN-<slug>.mjs` a partir de `assets/backend/add-001-funcoes.mjs`:
   `definitions` com os nomes do plan; JS que chama SQL por id usa o padrão
   de marcador (`references/publicacao.md`).
4. Simulador: `PUBLISH_ORDER`, `DDL_SOURCES` se houver tabela, `CHECK_INPUT`,
   seed com os cenários; `npm run sim:seed && npm run sim:check`.
   Depois os testes de backend: um `teste('C-00N: …')` em
   `simulator/smoke.mjs` por linha da seção Testes do plan (se o projeto não
   tem `smoke.mjs`, copie de `assets/backend/simulator/` e adicione
   `sim:smoke`/`test` ao `package.json`); `npm test` verde.
5. Frontend: nomes em `SERVER_FUNCTION_NAMES` + id local em `SERVER_FUNCTIONS`;
   acesso a dados só por `linhas()`/`acao()`; tela conforme o `docs/design.md`
   do projeto (tokens, primitivos, vocabulário do produto, sem controle
   nativo, PT-BR). Projeto da Benenutri: use `/benenutri:design` para
   construir e revisar as telas. Projeto sem design system: proponha
   definir um antes de criar componentes soltos. Regra de tela (cálculo,
   formatação, máscara, normalização) mora em `src/lib/` e ganha
   `frontend/tests/<slug>.test.mjs` (se o projeto não tem `tests/`, copie de
   `assets/frontend/tests/` e adicione o script `test`).
6. `npm test`, `npm run build` e `npm run lint` em `frontend/`; `npm test` em
   `backend/`; o que teste não cobre reproduzido no simulador; `tasks.md`
   marcado, inclusive as T-08x.
7. Alteração mínima: não reescreva tela, paleta ou navegação que não foi pedida.

## Fluxo D — Rodar local

```bash
cd backend && npm test              # sim:check (o SQL roda?) + sim:smoke (o fluxo faz a coisa certa?)
cd frontend && npm test             # node --test sobre a regra pura de src/lib/
cd backend && npm run sim           # simulador na porta do config.mjs
cd frontend && npm run dev          # sem VITE_MITRA_AUTH_URL entra no simulador
node mitra-hub/server.mjs           # ou tudo junto: http://localhost:3100, senha mitra123
```

Diagnóstico pelo `GET /health` do simulador (`semDefinicao`, `erros`). Com
`VITE_MITRA_AUTH_URL` preenchido o app bate em **produção** — só use quando o
usuário pedir explicitamente.

## Fluxo E — Publicar

Resumo (detalhe em `references/publicacao.md`):

1. `npm test` verde em `backend/` (check + smoke) e em `frontend/`; build e
   lint limpos; spec/plan/tasks atualizados.
2. `git fetch origin && git merge origin/main --no-edit` — leia o diff.
3. Um commit `tipo: descrição` + `git push origin main` (sem `--force`, sem
   `--rebase`, **sem trailer `Co-Authored-By` de Claude ou de qualquer
   agente** — a autoria é de quem publica; conflito → pergunte ao usuário).
4. Entregue ao usuário o **prompt para o sandbox** (sincronizar, rodar
   `setup-backend.mjs` + `add-NNN` + `sync-server-function-map.mjs`, build,
   share). A plataforma gera as migrations e commita.
5. `git pull` de volta: chegam migrations e o mapa de ids reais.

## Regras que quebram produção se ignoradas

1. Nunca execute `setup-backend.mjs`, `add-*.mjs` ou qualquer escrita do
   `mitra-sdk` da máquina local sem decisão explícita do usuário: aplica em
   produção **sem migration**.
2. Nunca crie, edite ou faça `git add` em `backend/migrations/` ou
   `migrations.yaml`. Append-only, do sistema.
3. `.env` nunca vai para o git nem para documento; `VITE_*` vai para o bundle
   público — token no frontend é vazamento.
4. Escrita de usuário final só por SF SQL; leitura só por SF. CRUD REST em tela
   é 403 esperando para acontecer.
5. `{{param}}` é substituído por texto: string com aspas, numérico nunca vazio,
   `:VAR_USER` para identidade. Nunca e-mail vindo do input como identidade.
6. Datas em `VARCHAR`, preenchidas no código; colunas em UPPERCASE.
7. Conflito de merge é decisão do usuário, em linguagem de negócio.
8. Commit sem assinatura de agente: nada de `Co-Authored-By: Claude` (nem
   outro trailer de IA) em nenhum repositório tocado por esta skill.
9. Sem teste não está pronto: spec sem a seção **Testes** preenchida não é
   aprovada; feature sem `teste()` no `smoke.mjs` para cada cenário de
   backend e sem `frontend/tests/` para a regra de tela não publica.

## Antes de dizer que terminou

- [ ] Spec, plan e tasks existem e batem com o código; `[NEEDS CLARIFICATION]` zerado ou listado ao usuário
- [ ] Seção **Testes** da spec cobre todo C-00N e RN-00N; cada linha tem um `teste()`/`test()` cujo título começa com o id
- [ ] `cd backend && npm test` verde (`sim:check` + `sim:smoke`)
- [ ] `cd frontend && npm test`, `npm run build` e `npm run lint` limpos
- [ ] O que teste não cobre (layout, tema, navegação) reproduzido no simulador
- [ ] Nomes de SF iguais em `add-NNN` e `SERVER_FUNCTION_NAMES`; `PUBLISH_ORDER` e seed atualizados
- [ ] Nenhum CRUD REST em tela; nenhuma cor literal; nenhum `type` importado entre arquivos
- [ ] `backend/migrations/` intocado; `.env` fora do commit
- [ ] Se publicou: prompt do sandbox entregue ao usuário; `git pull` feito depois
- [ ] Pedido original relido item a item: feito / parcial / não feito, sem omitir

## Mapa de referências e assets

| Quando | Abra |
|---|---|
| Desenhar tabela, SF, permissão, transporte; dúvida sobre `{{param}}`, 403, limites | `references/plataforma-mitra.md` |
| Criar projeto, decidir onde um arquivo mora, registrar no hub, portas | `references/estrutura-projeto.md` |
| Montar/estender o simulador, escrever os testes (`smoke.mjs`, `frontend/tests/`), JDBC externo, diagnóstico | `references/simulador.md` |
| Subir para o Mitra, prompt do sandbox, rollback, executar SDK local | `references/publicacao.md` |
| Escopar | `assets/templates/spec.md`, `plan.md`, `tasks.md` |
| Backend novo | `assets/backend/` (setup, add-001, sync, simulator com `smoke.mjs`, package.json com `test`) |
| Frontend novo | `assets/frontend/` (server-functions, mitra-api, mitra-auth, formato) + `tests/formato.test.mjs` |
| Design system, marca, telas e revisão de UI em projeto da Benenutri | skill `/benenutri:design` (plugin separado; esta skill é genérica) |
| CLAUDE.md e env de um projeto local | `assets/CLAUDE.md`, `assets/env/` |
| Exemplo completo e recente do padrão | `mitra-projects/p-57803` (CRM Ativa): constitution, design, specs, `lib/escritas.mjs`, simulador com smoke |
| Exemplo de projeto grande com `.specs/` + `.agents/` e JDBC Oracle | `mitra-projects/p-45547` (SGC) |
