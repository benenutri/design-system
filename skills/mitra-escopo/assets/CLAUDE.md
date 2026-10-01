# Project: p-NNNNN — <Nome do sistema>

App que roda dentro da plataforma **Mitra**: React 19 + TypeScript + Vite 7 +
Tailwind 4 no frontend; backend composto por tabelas e Server Functions que
vivem na plataforma, provisionadas pelos scripts de `backend/` com `mitra-sdk`.
Este clone é para **desenvolvimento local**: o backend é escrito aqui e
executado no sandbox do Mitra; o frontend roda aqui contra o simulador.

## Leia antes de escrever a primeira linha

1. `docs/constitution.md` — o processo (se existir).
2. `docs/design.md` — o sistema visual (se existir). É normativo.
3. A spec da feature: `docs/specs/NNN-slug/spec.md`, depois `plan.md`, depois `tasks.md`.

## Estrutura

```
frontend/                 React. Build SEMPRE daqui: cd frontend && npm run build
  src/lib/mitra-auth.ts     sessão e init do SDK (modo local x Mitra real)
  src/lib/mitra-api.ts      transporte único: linhas()/acao() sobre executeServerFunctionMitra
  src/lib/server-functions.ts  contrato NOMES + IDS das Server Functions
  src/lib/formato.ts        regra pura de tela (datas, moeda) — é o que se testa
  tests/*.test.mjs          testes do frontend (node --test), um por cenário/regra da spec
backend/                  scripts de provisionamento via mitra-sdk (.env vazio localmente)
  setup-backend.mjs         schema (CREATE TABLE IF NOT EXISTS) + dados iniciais de negócio
  add-NNN-*.mjs             Server Functions por spec, exportam `definitions`
  sync-server-function-map.mjs  leva os ids reais ao frontend após publicar
  simulator/                Mitra local em SQLite: executa as MESMAS definitions
  simulator/smoke.mjs       suíte de testes do backend: SFs reais + assert por cenário da spec
  migrations/               GERADO PELO SISTEMA — não toque
docs/specs/               spec.md (o quê) · plan.md (como) · tasks.md (ordem)
```

## Como rodar

```bash
cd backend && npm test            # sim:check (o SQL roda?) + sim:smoke (o fluxo faz a coisa certa?)
cd frontend && npm test           # node --test sobre a regra pura de src/lib/
cd backend && npm run sim         # simulador em http://localhost:<PORTA>
cd frontend && npm run dev        # app (sem VITE_MITRA_AUTH_URL entra no simulador)
cd frontend && npm run build      # obrigatório antes de subir
```

Ou tudo junto pelo painel: `node ../mitra-hub/server.mjs` (registre este projeto lá).

## Regras que quebram produção se ignoradas

1. **Não existe staging.** Com `VITE_MITRA_AUTH_URL` preenchido, toda Server
   Function chamada do `localhost` bate no banco de produção. Localmente,
   trabalhe no simulador.
2. **Nunca execute `setup-backend.mjs`, `add-*.mjs` ou qualquer escrita do
   `mitra-sdk` da máquina local** sem decisão explícita do usuário. O SDK é um
   cliente HTTP puro: rodar daqui aplica DDL/SF em produção **sem gerar
   migration**. Os scripts são escritos e commitados aqui; a execução acontece
   no sandbox da plataforma (veja "Como subir").
3. **Não crie, edite nem `git add` em `backend/migrations/` ou
   `migrations.yaml`.** Append-only, gerado pelo sistema.
4. **`.env` nunca é commitado.** `.env.example` só com as chaves, vazias.
   Token no frontend é falha de segurança (toda `VITE_*` vai para o bundle).
5. **Alteração mínima.** Não mude tela, fluxo ou componente que não foi pedido.
6. **Commit sem assinatura de agente.** Nunca acrescente `Co-Authored-By:
   Claude …` nem outro trailer de IA: a autoria é de quem publica.
7. **Sem teste não está pronto.** Cada cenário C-00N e regra RN-00N da spec
   tem um `teste()` em `backend/simulator/smoke.mjs` (SF real, banco
   descartável) ou um `test()` em `frontend/tests/` (função pura de
   `src/lib/`), com o id no título. `npm test` verde nos dois lados antes de
   marcar task ou publicar.

## Como o frontend fala com o backend

- Frontend importa **`mitra-interactions-sdk`**. Nunca `mitra-sdk` (backend)
  e nunca `fetch`/`axios` replicando o SDK.
- Usuário final é `userType=business`: CRUD REST retorna **403**. Toda
  leitura e escrita vai por Server Function, via `linhas()`/`acao()` de
  `src/lib/mitra-api.ts`.
- Parâmetro é **`input:`**, não `params:`. SF SQL recebe `{{nome}}` (string
  com aspas manuais: `'{{nome}}'`); `:VAR_USER` é o ID de quem chama.
- Retorno vem com **colunas em UPPERCASE** (`row.NOME`). Toda listagem é
  paginada (`LIMIT/OFFSET`). Filtro desligado é `''` no texto e `0` no número.
- Datas em `VARCHAR(10)`/`VARCHAR(19)`, preenchidas no código.
- Chamadas paralelas com `Promise.allSettled`.
- Nome novo de Server Function: entra em `add-NNN-*.mjs` **e** em
  `SERVER_FUNCTION_NAMES`; o id local em `SERVER_FUNCTIONS` é qualquer número
  único até o `sync:function-map` trazer o real.

## Como subir para o Mitra

1. `npm test` verde em `backend/` e em `frontend/`; `cd frontend && npm run build` limpo.
2. `git fetch origin && git merge origin/main --no-edit`; leia o diff.
3. **Um** commit + `git push origin main` (mensagem em português, `tipo: descrição`,
   **sem trailer `Co-Authored-By` de Claude ou de qualquer agente**).
4. No chat do projeto no Mitra, peça ao agente: *"sincronize com a main e rode
   `cd backend && node setup-backend.mjs && node add-NNN-*.mjs && node sync-server-function-map.mjs`,
   depois build e share"*. A plataforma materializa as migrations e commita.
5. De volta aqui: `git pull` para receber migrations e o mapa de ids atualizado.

## Armadilhas de build

- `verbatimModuleSyntax`: nunca importe `interface`/`type` de outro arquivo;
  defina o tipo localmente.
- `npm run build` roda `tsc -b`: erro de tipo derruba o build.
- `base: './'` no `vite.config.ts` faz o app funcionar em subpath. Não mexa.

## Antes de dizer que terminou

- [ ] `npm test` verde em `backend/` (check + smoke) e em `frontend/`; todo cenário da spec citado no título de um teste
- [ ] `npm run build` e `npm run lint` limpos em `frontend/`
- [ ] O que teste não cobre (layout, tema, navegação) aberto no simulador
- [ ] Nenhum CRUD REST em tela de usuário final; nenhuma cor literal
- [ ] `backend/migrations/` intocado; `.env` fora do commit
- [ ] Spec/plan/tasks atualizados; prompt original relido item a item
