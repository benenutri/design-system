# Estrutura canônica de um projeto Mitra

Leia ao criar um projeto do zero ou ao decidir onde um arquivo novo mora.

## Identidade

- Pasta e repositório: `p-NNNNN`, onde NNNNN é o **id do projeto na Mitra**
  (`MITRA_PROJECT_ID`). Repo privado em `github.com/mitra-agent-projects/p-NNNNN`.
- `main` é a baseline compartilhada; o sandbox trabalha em `user/<id-do-usuário>`
  (ex.: `user/20500`) e faz merge em `main` ao fim de cada turno. Localmente
  trabalhe em `main` (ou numa branch sua) e publique em `origin main`.
- Todos os projetos locais vivem lado a lado em `mitra-projects/`, com o
  `mitra-hub/` que sobe todos os simuladores e um painel "Meus Projetos".

## Árvore

```
p-NNNNN/
├── README.md                 o que o sistema faz, como rodar, mapa da documentação
├── CLAUDE.md                 regras operacionais (assets/CLAUDE.md é o modelo local)
├── AGENTS.md                 só aponta para CLAUDE.md (ferramentas procuram esse nome)
├── .gitignore                node_modules/ dist/ .env .env.* !.env.example backend/simulator/data/
├── .claude/
│   ├── launch.json           "simulador" (npm run sim --prefix backend) e "frontend"
│   └── hooks/block-migrations.mjs   (copie de p-45547 + registre em settings)
├── docs/
│   ├── constitution.md       princípios do processo (recomendado)
│   ├── design.md             sistema visual normativo (Benenutri: /benenutri:design)
│   ├── templates/            spec / plan / tasks (assets/templates)
│   └── specs/NNN-slug/       spec.md · plan.md · tasks.md   ← uma pasta por feature
├── backend/
│   ├── package.json          scripts: setup, publish:NNN, sync:function-map, sim, sim:seed, sim:check, sim:smoke, test
│   ├── .env.example          chaves vazias (assets/env/backend.env.example)
│   ├── setup-backend.mjs     schema (CREATE TABLE IF NOT EXISTS) + dados iniciais de negócio
│   ├── add-NNN-<slug>.mjs    Server Functions da spec NNN — exportam `definitions`
│   ├── lib/                  fragmentos compartilhados entre scripts (ex.: escritas SQL)
│   ├── sync-server-function-map.mjs
│   ├── simulator/            Mitra local (assets/backend/simulator)
│   │   └── smoke.mjs         OBRIGATÓRIO: suíte do backend — SFs reais + assert por cenário da spec
│   └── migrations/ + migrations.yaml   GERADOS PELO SISTEMA
├── frontend/
│   ├── package.json          dev / build (tsc -b && vite build) / lint / test (node --test "tests/**/*.test.mjs")
│   ├── .env.example          VITE_MITRA_AUTH_URL, VITE_MITRA_PROJECT_ID (+ VITE_MITRA_BASE_URL opcional)
│   ├── vite.config.ts        base: './', alias @ → src
│   ├── tests/                OBRIGATÓRIO: <slug>.test.mjs por regra de tela da spec (assets/frontend/tests)
│   └── src/
│       ├── App.tsx           rotas; `initMitra()` decide autenticado x /login
│       ├── index.css         FONTE ÚNICA de cor (tokens em :root ou @theme)
│       ├── lib/
│       │   ├── mitra-auth.ts         sessão + init do SDK (modo local x real)
│       │   ├── mitra-api.ts          linhas() / acao() / comPadrao()
│       │   ├── server-functions.ts   SERVER_FUNCTION_NAMES + SERVER_FUNCTIONS
│       │   └── formato.ts            regra pura (datas, moeda…) — o que tests/ importa
│       ├── components/ui/    primitivos genéricos (shadcn ajustados ou próprios)
│       ├── components/page.tsx   vocabulário do produto (Panel, Status, Code…)
│       ├── components/Logo.tsx   marca do cliente (cor explícita, não herdada do tema)
│       ├── features/<dominio>/   regra pura, contexto React (projetos maiores)
│       ├── data/<dominio>/       acesso a dados e normalização (projetos maiores)
│       └── pages/            telas roteáveis (LoginPage inclui o formulário do simulador)
└── uploads/                  anexos de desenvolvimento (fora do git se pesado)
```

Layout mais antigo que você vai encontrar (p-45547/p-57426): `.specs/NNN-slug/`
com `requirements.md`/`design.md`/`tasks.md` e `.agents/` (architecture,
db-schema, api-contracts, prd). **Respeite o layout que o projeto já tem**;
só crie `docs/specs/` em projeto novo ou sem specs.

Raiz aceita **somente** `README.md`, `CLAUDE.md`, `AGENTS.md`. Planos, tasks,
features e análises têm lugar em `docs/` — se um fluxo antigo mandar escrever
`tasks.md`/`plano-*.md`/`ux.md` na raiz, escreva no destino certo.

## Frontend — convenções que valem em todos os projetos

- React 19 · TypeScript · Vite 7 · Tailwind 4 · react-router-dom 7 ·
  lucide-react · recharts · `mitra-interactions-sdk`.
- **Testes obrigatórios** em `frontend/tests/*.test.mjs` com `node --test`
  (`node:test` + `node:assert/strict`; Node 22.18+ importa `.ts` direto, sem
  vitest nem dependência nova). Testa-se função pura de `src/lib/` —
  formatação, cálculo, máscara, normalização de linhas do backend. Regra que
  precisa de teste e está dentro de um componente é extraída para `src/lib/`.
  Cada `test` cita o cenário/regra da spec no título. Tela não se testa aqui:
  vai para a verificação manual dos cenários no simulador.
- `verbatimModuleSyntax`: **não importe `interface`/`type` de outro arquivo**
  (compila e quebra em runtime). Tipo local em cada arquivo.
- Texto visível em português com acentuação; sem emoji na UI (ícones);
  controles nativos (`<select>`, `<input type="date">`, checkbox, radio) não
  entram em componente novo — use os primitivos do projeto.
- Cor só por token de `index.css`; hex cru ou `text-green-700` em componente é
  defeito. Verifique qual camada de tema está ativa (`.theme-light` no body
  sobrescreve `:root` em alguns projetos).
- Duas camadas de componente: primitivo genérico em `components/ui/`,
  vocabulário do produto em `components/page.tsx`. Tela não escreve classe
  Tailwind solta.
- Toda leitura/escrita de tela passa por `mitra-api.ts`; IDs de SF só em
  `server-functions.ts`.
- Build sempre de `frontend/`, nunca da raiz. `dist/` não vai no git — o
  sandbox builda.

## Backend — convenções

- Um `add-NNN-<slug>.mjs` por spec (NNN = número da spec). Cada um exporta
  `definitions[]` (`{ name, type, description, code, jdbcId?, cronExpression? }`)
  e só publica quando é o entrypoint (`isEntrypoint()`), para o simulador
  poder importá-lo.
- Nome de SF com prefixo do sistema + domínio + ação: `crmPacienteSalvar`,
  `sgcListarFornecedores`, `ciCalcularSugestaoCompra`. A `description` cita a
  task/requisito e os parâmetros (é o que aparece no painel da Mitra).
- Upsert por nome; nunca apagar SF em uso. SF de sondagem descartável: apague
  depois de usar.
- `setup-backend.mjs` concentra o schema. Coluna nova em tabela existente entra
  como `ALTER TABLE ... ADD COLUMN` num `add-NNN-*.mjs` guardado por
  `listTablesMitra` (idempotente), e a tabela no `setup` ganha a coluna também
  (para projeto novo e para o simulador).
- Perfil de acesso: script próprio (`add-NNN-perfil-acesso.mjs`).
- **Testes obrigatórios** em `simulator/smoke.mjs`: executa as SFs reais em
  banco descartável e faz `assert` do que a spec exige, um `teste()` por
  cenário/regra com o id no título. `npm test` = `sim:check` + `sim:smoke`.
  Detalhe em `simulador.md`.
- `.env` do backend fica **vazio** localmente.

## Env

| Arquivo | Chaves | Local | Sandbox |
|---|---|---|---|
| `backend/.env` | `MITRA_BASE_URL`, `MITRA_BASE_URL_INTEGRATIONS`, `MITRA_TOKEN`, `MITRA_PROJECT_ID`, `MITRA_WORKSPACE_ID` | vazias | auto-populadas |
| `frontend/.env` | `VITE_MITRA_AUTH_URL`, `VITE_MITRA_PROJECT_ID`, `VITE_MITRA_BASE_URL` (opcional) | vazias → modo local | auto-populadas |

Nunca commite `.env`; `.env.example` só com as chaves.

## mitra-hub (painel local)

`node mitra-hub/server.mjs` → `http://localhost:3100`. Sobe o simulador e o
Vite de cada projeto registrado e faz SSO simulado (login único, senha
`mitra123`, redireciona com `#tokenMitra&backURLMitra`).

Registrar um projeto novo em `mitra-hub/server.mjs` (array `PROJETOS`):

```js
{ id: 'slug', pasta: 'p-NNNNN', nome: 'Nome do Sistema', iniciais: 'NS',
  cor: '#ddd6fe', corTexto: '#6d28d9', simPort: 31xx, vitePort: 51xx,
  ativo: true, emailPadrao: 'admin@empresa.local' },
```

O hub injeta `SIMULATOR_PORT` e `SIMULATOR_FRONTEND_URL` no simulador; o
`config.mjs` do kit honra `SIMULATOR_PORT`. `emailPadrao` precisa existir no
seed do projeto.

Portas em uso (set/2026):

| Projeto | sim | app |
|---|---|---|
| hub | 3100 | — |
| p-45547 SGC | 3101 | 5171 |
| p-56555 ITSM | 3102 | 5172 |
| p-57803 CRM Ativa | 3103 | 5173 |
| p-45654-refactor Comercial 360 | 3104 | 5174 |
| **próximo livre** | 3105 | 5175 |

Atualize a tabela do `mitra-hub/README.md` ao registrar.
