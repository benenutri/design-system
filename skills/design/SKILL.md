---
name: design
description: Design system oficial da Benenutri para os projetos Mitra (p-NNNNN): tokens de cor e tipografia (Manrope + Work Sans, verde #156b16), marca (logos, monograma, favicon), primitivos shadcn já ajustados, vocabulário de tela (PageHeader, Panel, Toolbar, SelectMenu, Status, Table, Pagination) e os anti-padrões que reprovam revisão. Use SEMPRE que, num projeto da Benenutri, o pedido envolver tela, página, layout, componente, formulário, tabela, filtro, diálogo, cor, tema, fonte, logo, favicon, "design system", shadcn, Tailwind, "deixar bonito", "padronizar visual", revisar UI, ou instalar/portar o padrão visual num projeto novo — mesmo que o usuário não diga "design".
---

# Design system Benenutri

O kit completo está em `assets/` desta skill (leia `assets/README.md` para o
mapa arquivo → destino). O documento normativo é `assets/design.md`: 14 seções
que valem como lei — **onde ele e o código divergirem, um dos dois está errado;
descubra qual antes de mudar**. Esta skill diz quando ler cada seção e como
aplicar sem reinventar.

Origem: CRM Ativa (p-57803), versão portada para Tailwind 4 em 2026-08-27.
O contrato de nomes de token (`bg-card`, `text-ink-secondary`,
`border-rule-row`, `bg-brand-50`…) é o mesmo em todos os projetos que adotam
o kit.

## Que modo usar

| Pedido | Modo | Leia |
|---|---|---|
| projeto novo, ou projeto sem design system | **Instalar** | `assets/README.md`, `design.md` §1.5 e §14 |
| projeto com tema antigo (classes `.theme-light`, hex inline, tokens `--color-*` do template Mitra) | **Portar** | `design.md` §2, §3, §14 |
| "cria a tela X", "adiciona um filtro", "faz o diálogo de…" | **Construir** | `design.md` §8, §9, §10 |
| "revisa a UI", "está fora do padrão?", PR com telas | **Revisar** | `design.md` §5, §14 (anti-padrões) |
| logo, favicon, cor da marca, tela de login | **Marca** | `design.md` §10.1, §11 |
| "modo escuro", "dark mode", "tema", "cor nova", "está estourando no escuro" | **Tema escuro** | `design.md` §2.1, `assets/README.md` |

## O essencial em dez linhas

1. **Cor só por token** de `src/index.css` (`:root` é a fonte única). Hex cru
   ou `text-green-700` em componente é defeito, não gosto.
2. **Duas camadas, nenhuma terceira**: primitivo genérico em
   `components/ui/` (shadcn ajustado no próprio arquivo); vocabulário do
   produto em `components/page.tsx`. **Tela não escreve classe Tailwind
   solta** — se precisou, falta um nome no `page.tsx` ou o primitivo está mal
   ajustado; corrija lá.
3. Fundo da tela `#f4f5f3`, componente branco sólido por cima; área rebaixada
   dentro do componente usa `paper-sunken`, nunca um terceiro cinza.
4. **Sem azul** como acento em tela operacional. Verde = positivo/vivo,
   âmbar (`attention`) = atenção, vermelho (`alert`) = risco/destrutivo.
   **Inativo é cinza** (`Status tone="off"`), nunca vermelho.
5. `ink-muted` (3,8:1) só em rótulo de cabeçalho em caixa alta; corpo de texto
   usa `ink` ou `ink-secondary`.
6. Tabela minimalista: sem zebra, sem selo preenchido em célula (estado é
   `Status`), identificador é `Code`, número alinha à direita (`numeric`),
   ausência de dado é `Dash` (nunca `0` ou `R$ 0,00`).
7. `SelectMenu` (Popover + cmdk) no lugar de `<select>` nativo; data continua
   `<input type="date">`. Dentro de diálogo: `<Popover modal>`,
   `pointer-events-auto`, filtro sem acento (§9.3).
8. Botão padrão é `secondary`; só a ação principal é `primary`. Sem permissão,
   o botão **desabilita**, não some.
9. Tipografia: título `font-title` (Manrope), corpo Work Sans em `text-[13px]`;
   escala completa no §4. `tabular-nums` é global.
10. **O verde da marca (`#45963d`) não é o `--primary` (`#156b16`).** A marca
    nunca é recolorida; `BRAND_GREEN` fica explícito em `Logo.tsx`.

11. **Tema escuro é uma camada `.dark` de tokens**, não um segundo conjunto
    de componentes. Cor nova nasce em `:root` **e** em `.dark`; `dark:` solto
    em tela é defeito. A classe é aplicada por `lib/theme.ts` (claro / escuro /
    sistema) e pelo script inline do `index.html`; o botão é `ThemeToggle`.

Ausências deliberadas (§1.4): sem lib de formulário, sem estado global, sem
date picker, sem CSS-in-JS, sem toast. Reverter é emenda à constitution, não
`npm i`.

## Tema escuro

- Instalar num projeto que já tem o kit claro: copie o bloco `.dark` do
  `assets/index.css` (logo após o `:root`), atualize o comentário do
  `@custom-variant dark`, adicione `lib/theme.ts`, `ThemeToggle.tsx` (rodapé do
  menu, ao lado de "Sair") e o script inline do `index.html`.
- Ao revisar: todo token de `:root` tem par em `.dark`? Algum componente usa
  `text-white`/`bg-white`/hex? (só o botão destrutivo usa `text-white`, e a
  paleta escura foi escolhida para ele passar). Contraste mínimo 4,5:1 nos dois
  temas — meça, não estime; `ink-muted` continua só rótulo.
- `Wordmark` (PNG verde `#45963d`) fica legível sobre `#131513` (5:1); o
  favicon não muda. O `Monogram` herda `currentColor`, e é aí que mora a
  armadilha: o verde da marca sobre o quadrado `bg-accent` do login dá 4,1:1
  no claro e só 2,6:1 no escuro. No escuro o monograma toma a cor do par tonal
  do quadrado (`text-accent-foreground`, 9,2:1) — isso não recolore a marca,
  é o mesmo mecanismo de "branco sobre o verde" do §11. Use `MonogramTile`
  (`Logo.tsx`) para o quadrado do login em vez de montá-lo na tela; para a
  marca em classe existe `text-brand-mark` (token fixo nos dois temas).
- Quer ver antes de codar: abra `assets/vitrine.html` no navegador — tokens
  com contraste medido ao vivo, componentes, listagem, login e marca, com o
  seletor claro / escuro / sistema.

## Instalar (projeto novo ou sem design system)

1. Dependências: veja `assets/README.md` (pacote unificado `radix-ui`; nunca
   `@radix-ui/react-*` avulso).
2. Copie pelo mapa do README: `index.css`, `index.html`, `components.json`,
   `vite.config.ts`, os **dois** tsconfigs (alias `@` nos dois — o CLI do
   shadcn lê o raiz), `lib/utils.ts`, `components/ui/*`, `components/page.tsx`,
   `components/Logo.tsx`, `public/favicon.svg`, `public/logo-bn.svg`,
   `src/assets/logo-benenutri.png`.
3. `docs/design.md` e `docs/constitution.md` ← `assets/`; troque o nome do
   projeto e a data de ratificação na constitution.
4. Apague do `page.tsx` o que é do CRM (`EtiquetaLista`, `CheckRow`) se a spec
   não pedir. `AdminLayout.tsx` é **exemplo**: reescreva módulos, rotas e a
   sessão do projeto, preservando as três decisões estruturais do §10
   (janela que não rola, cabeçalho grudento só em `lg`, menu com estado em
   `localStorage`).
5. Tela de login conforme §10.1, com o formulário do simulador quando não há
   `VITE_MITRA_AUTH_URL` (a skill `mitra-escopo` cuida do lado Mitra).
6. `npm run build` limpo; abra a tela e confira fontes carregadas e favicon.

## Portar (projeto com tema antigo)

Cada projeto antigo tem uma camada diferente: o SGC (p-45547) tem classes
`.theme-light`/`.theme-dark` que sobrescrevem `:root`; o Comercial 360
(p-45654) migrou 3.355 hex inline para tokens em `:root` sem `@theme`. Antes
de tocar, descubra **qual camada está ativa** (classe no `<body>`) e onde as
telas leem cor.

Ordem que funciona: (1) `index.css` novo com os tokens e o `@theme inline`;
(2) primitivos e `page.tsx`; (3) uma tela por vez, trocando classe solta por
nome do vocabulário; (4) `Logo.tsx` e marca; (5) só então remova a camada
antiga. Um `grep` por `#[0-9a-f]{3,6}` e por `text-(green|blue|gray)-` no
`src/` mede o que falta. Não faça a migração inteira sem pedido explícito:
proponha a trilha e as waves.

## Construir tela ou componente

- Leia §8 (assinatura de cada nome do `page.tsx`) e §9 (padrões de tela)
  antes de escrever. Uma listagem é `PageHeader` + `Panel` + `Toolbar`
  (`SearchInput`, `SelectMenu`, `MoreFilters`, `FilterChip`) + `Table`
  (`Th`/`Td` com `numeric`, `RowTitle`/`RowMeta`, `Status`, `Code`, `Dash`,
  `IconButton`) + `Pagination`. Se a tela precisou de classe crua, pare e
  acrescente o nome que falta ao `page.tsx`.
- Diálogo: `max-h-[90vh]`, só o miolo rola (`DialogBody`), rodapé
  `flex-col-reverse sm:flex-row sm:justify-end`, ação primária à direita.
- Aba: ação primária mora na faixa da aba, não no cabeçalho; aba sem
  permissão não é renderizada.
- Aviso é `Alert` no fluxo da tela; não some sozinho.
- Estado vazio é convite para agir (`EmptyState` com `action`).
- Componente novo do shadcn: `npx shadcn@latest add <nome>` e **reaplique os
  ajustes do §7** (raio, altura, `text-[13px]`, cores por token) no próprio
  arquivo — o CLI reescreve o arquivo e apaga o que existia.
- Ícone decorativo `aria-hidden`; ícone que é botão usa `IconButton label=`.
- Texto em português com acentuação; sem emoji na UI.

## Revisar

Percorra as telas alteradas contra a lista de anti-padrões do §14. Reporte
por arquivo e linha, uma linha por achado: o que está, qual token/nome do
vocabulário substitui. Reprovam sem discussão de mérito: cor crua, `<select>`
nativo em painel, selo preenchido em célula, zebra, inativo vermelho,
`ink-muted` em corpo, azul estrutural, botão escondido por permissão, `0`
onde é `Dash`, `shadcn add` sem reaplicar o diff, `@radix-ui/react-*` avulso,
cor definida só no `@theme` fora do `:root`. Contraste mínimo de texto e
ícone: 4,5:1 sobre branco.

## Marca

| Peça | Arquivo | Cor | Uso |
|---|---|---|---|
| Assinatura | `logo-benenutri.png` via `<Wordmark />` | `#45963d` (no PNG) | menu expandido, barra mobile, login |
| Monograma BN | inline em `Logo.tsx` (`<Monogram />`); `logo-bn.svg` fora do React | `currentColor` | menu recolhido, login, avatar |
| Favicon | `favicon.svg` | branco sobre `#156b16` | aba |

Tela de login (§10.1): duas metades em `lg`; à esquerda assinatura, manchete
em `font-title text-4xl`/`sm:text-5xl` e bloco `rounded-3xl bg-brand-50`; à
direita cartão `max-w-md rounded-3xl border-rule-table bg-paper p-8 shadow-sm`
com o monograma num quadrado `rounded-2xl bg-accent`; submit `w-full`.

## Outra marca (projeto fora da Benenutri)

Siga o §14: troque só `--primary`, `--accent`, `--ring` e a rampa `--brand-*`
no `:root` (formato `hsl()`, hex no comentário), confira contraste ≥ 4,5:1,
troque fontes e `<link>` juntos, substitua os arquivos de marca e o
`BRAND_GREEN`. Nenhum `@theme` precisa mudar.

## Ao commitar

Mensagem em português, `tipo: descrição`, e **sem trailer `Co-Authored-By:
Claude …`** (nem qualquer assinatura de agente) — vale para todo repositório
tocado por este plugin. Fluxo completo de SYNC/SHARE na skill `mitra-escopo`.

## Mapa

| Quando | Abra |
|---|---|
| Qualquer decisão visual | `assets/design.md` (índice: §1 stack · §2 tokens · §3 apelidos · §4 tipografia · §5 cores · §6 forma · §7 primitivos · §8 vocabulário · §9 padrões de tela · §10 layout e login · §11 marca · §12 gráficos · §13 movimento/acessibilidade · §14 checklist e anti-padrões) |
| Copiar arquivos, dependências | `assets/README.md` |
| Processo (spec antes de código, migrations, tokens) | `assets/constitution.md` |
| Implementação de referência viva | `mitra-projects/p-57803/frontend/src` |
| Lado Mitra do projeto (spec, backend, simulador, publicação) | skill `mitra-escopo` |
