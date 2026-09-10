# Plugin `benenutri` para Claude Code

Design system, marca e convenções visuais da Benenutri para os projetos que
rodam na plataforma Mitra (`p-NNNNN`).

O plugin não é documentação avulsa: ele carrega a skill `design`, que instrui o
agente sobre **quando** ler cada seção do sistema visual e como aplicá-la sem
reinventar. O documento normativo é
[`skills/design/assets/design.md`](skills/design/assets/design.md) — 14 seções
que valem como lei, com a regra de ouro herdada:

> Onde o documento e o código divergirem, um dos dois está errado; descubra
> qual antes de mudar qualquer coisa.

## O que tem aqui

| Caminho | O que é |
|---|---|
| `.claude-plugin/plugin.json` | manifesto do plugin |
| `skills/design/SKILL.md` | a skill: qual modo usar (instalar, portar, construir, revisar, marca, tema escuro) |
| `skills/design/assets/design.md` | sistema visual normativo — tokens, tipografia, cores, forma, primitivos, vocabulário, padrões de tela, marca, checklist |
| `skills/design/assets/README.md` | mapa arquivo → destino ao instalar num projeto novo |
| `skills/design/assets/constitution.md` | princípios de processo (spec antes de código, migrations, tokens) |
| `skills/design/assets/vitrine.html` | página autocontida: tokens com contraste medido ao vivo, componentes, listagem, login e marca, nos dois temas — abra no navegador |
| `skills/design/assets/components/` | primitivos shadcn já ajustados, vocabulário de tela (`page.tsx`), marca (`Logo.tsx`), layout de exemplo |
| `skills/design/assets/index.css` | fonte única de cor: `:root`, `.dark` e os apelidos de token |
| `skills/design/assets/public/`, `src-assets/` | favicon, monograma e assinatura |

Origem: CRM Ativa (`p-57803`), portado para Tailwind 4 em 2026-08-27. O
contrato de nomes de token (`bg-card`, `text-ink-secondary`, `border-rule-row`,
`bg-brand-50`…) é o mesmo em todos os projetos que adotam o kit — é ele que faz
o sistema atravessar projeto sem reescrita.

## Como usar

Clone dentro da pasta de skills do Claude Code:

```bash
git clone https://github.com/benenutri/design-system.git ~/.claude/skills/benenutri
```

Depois, num projeto da Benenutri, chame `/benenutri:design` — ou simplesmente
peça o que quer (uma tela, um filtro, revisar a UI, instalar o padrão visual
num projeto novo) que a skill entra sozinha.

## Ao mudar o kit

O `design.md` é normativo. Mudou componente? Atualize a seção correspondente no
**mesmo commit**, e confira se a `vitrine.html` continua batendo — ela já
pegou três divergências entre o que a doc prometia e o que o código fazia.

Contraste é **medido**, não estimado: 4,5:1 para texto e 3:1 para elemento
gráfico, nos dois temas.

Mensagem de commit em português, sem rodapé de atribuição de agente.
