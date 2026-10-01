# Skill `mitra-escopo` para Claude Code

Escopar, produzir localmente e publicar projetos que rodam na **plataforma
Mitra** (`p-NNNNN`).

A skill captura o padrão já provado nos projetos em `mitra-projects/` — SGC
(`p-45547`), ITSM (`p-56555`), CRM Ativa (`p-57803`), Comercial 360
(`p-45654`) — para que um projeto novo ou uma feature nova nasça do mesmo
jeito: **spec antes de código**, backend escrito aqui e executado no sandbox,
frontend rodando contra um simulador que executa as **mesmas** Server Functions
que vão para produção.

## Os cinco fluxos

| O pedido é… | Fluxo |
|---|---|
| "escopa/especifica X", "faz a spec de…" | **A. Escopar** |
| "cria um projeto novo para…" | A → **B. Projeto novo** |
| "adiciona a feature Y no p-NNNNN" | A → **C. Feature** |
| "roda local", "sobe o simulador" | **D. Rodar local** |
| "sobe pro Mitra", "publica" | **E. Publicar** |

Uma feature completa é A → C → D → E.

## O que tem aqui

| Caminho | O que é |
|---|---|
| `SKILL.md` | a skill: qual fluxo seguir, o modelo mental da plataforma e as armadilhas |
| `references/plataforma-mitra.md` | como a Mitra funciona: Server Functions por id, perfis, teto de 300 SF/min, colunas em UPPERCASE |
| `references/estrutura-projeto.md` | anatomia de um repositório `p-NNNNN` (`frontend/` + `backend/`) |
| `references/simulador.md` | o Mitra em SQLite que roda na sua máquina |
| `references/publicacao.md` | subir para o sandbox e para produção |
| `assets/backend/` | `setup-backend.mjs`, `add-NNN-*.mjs` e o simulador completo, com `smoke.mjs` (a suíte de testes do backend) |
| `assets/frontend/` | `mitra-api.ts`, `mitra-auth.ts`, `server-functions.ts`, `formato.ts` e `tests/` (`node --test`) |
| `assets/templates/` | `spec.md`, `plan.md`, `tasks.md` |
| `assets/env/` | `.env.example` do backend e do frontend |
| `assets/CLAUDE.md` | convenções que o projeto gerado herda |

## Três coisas que surpreendem quem chega

**Os scripts do backend não rodam aqui.** `setup-backend.mjs` e os `add-*.mjs`
são escritos na sua máquina mas executados **no sandbox da plataforma**, porque
é lá que a migration é gerada. O que roda local é o simulador.

**O simulador não reimplementa nada.** Ele carrega as mesmas `definitions` dos
`add-*.mjs` e o mesmo DDL do setup, em SQLite. É de propósito: bug de SQL
aparece na sua máquina, não depois de publicar.

**Testes são obrigatórios e nascem na spec.** A spec lista, por cenário, a
evidência automática exigida; o plan mapeia cada linha para
`backend/simulator/smoke.mjs` (SFs reais + `assert`) ou `frontend/tests/`
(`node --test` sobre função pura); as tasks têm uma task por teste. Nada é
"pronto" nem publica sem `npm test` verde nos dois lados.

## Como usar

```bash
git clone https://github.com/benenutri/mitra-escopo.git ~/.claude/skills/mitra-escopo
```

Depois é só pedir o que quer — escopar uma feature, subir o simulador,
publicar — que a skill entra sozinha, mesmo sem a palavra "Mitra" no pedido,
desde que o projeto tenha `backend/` com `mitra-sdk`.

## Ao mudar a skill

Os `.env.example` nascem **vazios** de propósito: na Mitra quem popula é o
sandbox, e toda `VITE_*` vai para o bundle público. Nunca comite valor real
neles.

Mensagem de commit em português, sem rodapé de atribuição de agente.
