# Design system Benenutri — kit portável (origem: CRM Ativa, p-57803)

Cópia integral do sistema visual do CRM Ativa, o mais recente e refinado dos
projetos Mitra da Benenutri. `design.md` é o documento normativo (14 seções:
stack, tokens, tipografia, cores, forma, primitivos, vocabulário do produto,
padrões de tela, layout, marca, gráficos e BI, acessibilidade, checklist de
porte).
Leia o §14 dele antes de portar; este README só diz **o que copiar para onde**.

## Mapa de arquivos → destino no projeto novo

| Neste kit | Destino | O que é |
|---|---|---|
| `design.md` | `docs/design.md` | sistema visual normativo |
| `constitution.md` | `docs/constitution.md` | princípios do processo (ajuste o nome do projeto e a data de ratificação) |
| `index.css` | `frontend/src/index.css` | **fonte única de cor**: `:root` (tokens), `@theme` (fontes), `@theme inline` (apelidos) |
| `index.html` | `frontend/index.html` | favicon, `theme-color`, Google Fonts (Manrope + Work Sans) com `preconnect` |
| `components.json` | `frontend/components.json` | config do CLI do shadcn (`new-york`, css em `src/index.css`, alias `@`) |
| `vite.config.ts` | `frontend/vite.config.ts` | plugin Tailwind 4, `base: './'`, alias `@` |
| `tsconfig.json`, `tsconfig.app.json` | `frontend/` | alias `@/*` nos **dois** (o CLI do shadcn lê o raiz) |
| `lib/utils.ts` | `frontend/src/lib/utils.ts` | `cn()` |
| `lib/theme.ts` | `frontend/src/lib/theme.ts` | tema claro/escuro/sistema: `getTheme`, `setTheme`, `toggleTheme`, `applyTheme`, `watchSystemTheme` (§2.1) |
| `components/ThemeToggle.tsx` | `frontend/src/components/ThemeToggle.tsx` | botão Sol/Lua sobre `IconButton`, em tom neutro; **já montado** no rodapé do `AdminLayout` de exemplo |
| `components/ui/*.tsx` | `frontend/src/components/ui/` | primitivos shadcn **já ajustados** (§7). Não rode `npx shadcn add` por cima sem reaplicar o diff |
| `components/page.tsx` | `frontend/src/components/page.tsx` | vocabulário do produto (§8): `PageHeader`, `Panel`, `Toolbar`, `SelectMenu`, `Status`, `Table`, `Pagination`, `Board`/`BoardColumn`/`BoardCard`, e o bloco 8.7 de BI (`Kpi`, `Delta`, `Sparkline`, `PainelGrafico`, `corDeSerie`, `tomDeIntensidade`). `EtiquetaLista` e `CheckRow` são do CRM: apague se a spec não pedir; sem gráfico, apague o bloco 8.7 e o reexport de `ui/chart` |
| `components/Logo.tsx` | `frontend/src/components/Logo.tsx` | marca: `BRAND_GREEN`, `Monogram` (SVG inline, `currentColor`), `MonogramTile` (quadrado do login, certo nos dois temas), `Wordmark` (PNG) |
| `vitrine.html` | — (referência) | página autocontida com tokens, tipografia, componentes, listagem, login e marca nos dois temas; abra no navegador para ver o padrão antes de codar |
| `components/AdminLayout.tsx` | `frontend/src/components/AdminLayout.tsx` | **exemplo** do layout (§10): janela que não rola, menu lateral com estado em `localStorage`, gaveta no mobile. Acoplado ao CRM (importa `@/lib/sessao`, módulos e rotas dele) — adapte |
| `public/favicon.svg` | `frontend/public/favicon.svg` | monograma branco sobre `#156b16` |
| `public/logo-bn.svg` | `frontend/public/logo-bn.svg` | monograma vetorial (`currentColor`) para uso fora do React |
| `src-assets/logo-benenutri.png` | `frontend/src/assets/logo-benenutri.png` | assinatura completa, 3× a largura exibida |

Dependências (§1.5):

```bash
npm i react-router-dom class-variance-authority clsx tailwind-merge tw-animate-css lucide-react cmdk radix-ui recharts
npm i -D tailwindcss @tailwindcss/vite @types/node
```

`recharts` só se houver gráfico — e aí ele vem com o trio inteiro:
`components/ui/chart.tsx`, o bloco 8.7 do `page.tsx` e os tokens `--data-*`
do `index.css` (§12). Sem gráfico, os três saem juntos. `radix-ui` é o pacote
**unificado**; não instale `@radix-ui/react-*` avulsos.

## Marca (§11)

| Peça | Arquivo | Cor | Uso |
|---|---|---|---|
| Assinatura (wordmark) | `logo-benenutri.png` via `<Wordmark />` | verde da marca `#45963d` (já no PNG) | menu expandido, barra mobile, login |
| Monograma BN | inline em `Logo.tsx` (`<Monogram />`), também `logo-bn.svg` | `currentColor` | menu recolhido, login, avatar |
| Favicon | `favicon.svg` | branco sobre `#156b16` | aba do navegador |

**O verde da marca (`#45963d`) não é o `--primary` (`#156b16`).** A marca nunca
é recolorida para o verde da interface; `BRAND_GREEN` fica explícito em
`Logo.tsx` e, para uso em classe, no token `--brand-mark` (`text-brand-mark`),
igual nos dois temas. Onde esse verde não lê (monograma sobre `bg-accent` no
escuro), o `MonogramTile` troca para `accent-foreground`: o lugar dita a cor.

## O que é da Benenutri e o que é do projeto

Vale para qualquer sistema da Benenutri **sem alteração**: paleta (`:root`),
fontes, marca, primitivos, vocabulário, padrões de tela e anti-padrões.

Muda por projeto: `PageHeader`/`AdminLayout` (módulos, rotas, permissões),
`<title>` do `index.html`, textos da tela de login (§10.1), e a lista de
componentes shadcn realmente usados (remova o que a spec não pede).

Para outra marca (projeto fora da Benenutri) siga o §14 do `design.md`: troque
só `--primary`, `--accent`, `--ring` e a rampa `--brand-*` no `:root`,
verifique contraste ≥ 4,5:1, troque fontes + `<link>` juntos, substitua os
arquivos de marca e o `BRAND_GREEN`.

## Tema escuro (§2.1)

Uma camada `.dark` de tokens no `index.css`, mesmos nomes e valores invertidos,
com contrastes medidos. Nenhum componente muda. A classe vai no `<html>`:
`lib/theme.ts` decide (claro / escuro / sistema, persistido em `localStorage`
na chave `theme`), o script inline do `index.html` aplica antes do React montar,
e `ThemeToggle.tsx` é o botão. `color-scheme: dark` escurece os controles
nativos (data, scrollbar). Ao criar cor nova, defina em `:root` **e** em `.dark`.

## Ausências deliberadas (§1.4)

Sem biblioteca de formulário, sem estado global, sem date picker, sem
CSS-in-JS, sem toast, sem `<select>` nativo em painel. Reverter qualquer uma
exige emenda à constitution, não `npm i`.
