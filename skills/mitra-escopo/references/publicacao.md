# Publicar: da máquina local para o Mitra

Leia antes de qualquer commit que suba para `origin main` e sempre que o
usuário pedir para "subir", "publicar", "mandar pro Mitra", "colocar em produção".

## A verdade que organiza tudo

1. **Não existe staging.** Produção é o único ambiente da plataforma.
2. O **frontend** é local de ponta a ponta: escrito, rodado e validado aqui; o
   sandbox só builda o que chegou pelo git.
3. O **backend** é escrito aqui e **executado no sandbox** da plataforma. O
   `mitra-sdk` é um cliente HTTP puro: rodá-lo daqui aplica DDL/SF em produção
   **sem gerar migration** (a materialização é da plataforma, ao fim de um
   turno no sandbox). O schema anda, a história não, e a divergência só
   aparece depois.
4. Os ids reais das Server Functions só existem depois da publicação; o
   frontend recebe-os pelo `sync-server-function-map.mjs`, também no sandbox.

## Passo a passo

### 0. Antes de subir

- `cd backend && npm test` verde (`sim:check` + `sim:smoke`, com um `teste()`
  por cenário da spec) — sem isso não publica.
- `cd frontend && npm test` verde, `npm run build` limpo (o `tsc -b` reprova
  erro de tipo) e `npm run lint`.
- O que teste não cobre (layout, tema, navegação) aberto no simulador.
- Cada SF nova está em `add-NNN-*.mjs` (exporta `definitions`) **e** em
  `SERVER_FUNCTION_NAMES`; tabela/coluna nova está no `setup-backend.mjs` (e,
  se for coluna em tabela existente, num `ALTER TABLE` idempotente no `add-*`).
- Spec/plan/tasks atualizados; nada em `backend/migrations/` tocado; `.env`
  fora do commit; nenhuma cor literal nem CRUD REST em tela de usuário final.

### 1. SYNC

```bash
git fetch origin && git merge origin/main --no-edit
```

Leia o diff: o sandbox commita migrations e merges de outros turnos; outro
colaborador pode ter mexido no que você mexeu. Conflito → **pergunte ao
usuário em linguagem de negócio**; nunca resolva sozinho.

### 2. SHARE

Um commit para o conjunto, mensagem em português no formato `tipo: descrição`
(`feat`, `fix`, `refactor`, `style`, `chore`, `docs`). **A mensagem termina na
descrição: é proibido o trailer `Co-Authored-By: Claude …` (ou qualquer
assinatura de agente) nos commits destes projetos.** O histórico é da equipe
da Benenutri; a autoria é de quem publica.

```bash
git add -A -- . ':(exclude)backend/migrations' ':(exclude)backend/migrations.yaml'
git commit -m "feat: adiciona etiquetas ao atendimento (spec 003)"
git push origin main
```

Nunca `--force`, nunca `--rebase`, nunca apagar branch remota, nunca
`Co-Authored-By`. Push recusado (non-fast-forward) → `git pull --no-rebase
origin main` e tente de novo.

### 3. Executar o backend no sandbox

No chat do projeto na plataforma Mitra, um turno com o pedido explícito. Modelo:

> Sincronize com a `main` (`git fetch origin && git merge origin/main`). Depois
> rode, em `backend/`: `node setup-backend.mjs`, `node add-003-etiquetas.mjs`
> e `node sync-server-function-map.mjs`. Se for a primeira publicação, rode
> também `node add-00X-perfil-acesso.mjs`. Em seguida `cd frontend && npm run
> build` e faça o SHARE (commit + push na main). Não altere nada além disso.

O que acontece lá: o SDK roda com o `.env` real; a plataforma materializa as
migrations e commita; o mapa de ids do frontend é reescrito e commitado; o
build publicado passa a ser o novo.

Se o projeto ainda não existe na Mitra: crie-o pela plataforma (ou
`createProjectMitra` a partir de um projeto que já tenha token), anote o id
(`p-NNNNN`), crie o repositório em `mitra-agent-projects`, e o primeiro turno
no sandbox é o que popula os `.env`.

### 4. Voltar

```bash
git pull --no-rebase origin main
```

Recebe migrations, `migrations.yaml` e `server-functions.ts` com os ids reais.
O simulador continua funcionando: resolve por **nome**, então ids novos não o
afetam.

### 5. Conferir em produção

- Abra o app publicado com um usuário **business** (não dev): é ele que sofre
  403/400 de permissão. Sem perfil → rode o script de perfil no sandbox.
- SF que "não retorna nada": `readServerFunctionMitra` no sandbox mostra o
  código publicado; compare com a definition local.

## JavaScript que chama outra SF por id

A JS precisa do id da SQL que ela chama, e o id nasce na publicação. Padrão:

```js
// lib/escritas.mjs
export const MARCADOR_IDS = '__IDS__';
export const injetarIds = (code, mapa) => String(code).split(MARCADOR_IDS).join(JSON.stringify(mapa));
// no corpo da JS: const IDS = __IDS__; await executeServerFunctionMitra({ projectId, serverFunctionId: IDS.pacienteInserir, input })
// no add-*.mjs: publica as SQL primeiro, monta o mapa chave→id, injeta, publica a JS
// no simulador: mesma injeção com ids locais (runtime carrega as escritas e atribui ids a partir de 9001)
```

Referência completa: `p-57803/backend/lib/escritas.mjs`, `add-001-crm-functions.mjs`
(função `upsert`) e `simulator/runtime.mjs` do mesmo projeto.

## Executar o SDK localmente — quando e como

Só com **decisão explícita do usuário**, que precisa saber que:

- aplica em produção imediatamente e **sem migration** (a história em
  `backend/migrations/` fica atrás do schema real);
- o `setup-backend.mjs` completo é idempotente por `IF NOT EXISTS`, mas
  qualquer DDL destrutivo escrito à mão roda de verdade;
- precisa do `.env` real do backend (copiado do sandbox), que **nunca** entra
  no git nem em documento.

Casos em que costuma valer: sondagem de leitura (`listServerFunctionsMitra`,
`listTablesMitra`, `runQueryMitra` de SELECT) para inspecionar o estado real.
Leituras não geram migration e são seguras. Se o usuário decidir escrever
localmente mesmo assim, registre no `tasks.md` da spec que aquela mudança
entrou sem migration, para o próximo turno no sandbox reconciliar com um
script idempotente.

## Rollback

Não existe "desfazer migration". Correção é migration nova: ajuste o script
(`ALTER`, `UPDATE` da SF via upsert) e publique de novo. SF errada em uso:
corrija o `code` e republique (o upsert atualiza pelo nome); só apague SF que
nenhuma tela chama.
