// Server functions — spec 001-<slug>.
//
// NAO EXECUTE ESTE ARQUIVO DA MAQUINA LOCAL sem decisao explicita do usuario
// (a plataforma so gera migration quando o script roda no sandbox).
// Uso (no sandbox): cd backend && node add-001-funcoes.mjs
//
// O upsert e por NOME: funcao que ja existe e atualizada, funcao nova e
// criada. Rodar de novo e barato e nao duplica nada.
//
// `definitions` e exportado de proposito: o simulador local carrega ESTE
// array e executa o mesmo SQL e o mesmo JavaScript que sao publicados no
// Mitra. Nomes aqui sao o contrato com `frontend/src/lib/server-functions.ts`
// (bloco SERVER_FUNCTION_NAMES): mudou aqui, muda la.

import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import {
  configureSdkMitra,
  listServerFunctionsMitra,
  createServerFunctionMitra,
  updateServerFunctionMitra,
} from 'mitra-sdk';

configureSdkMitra({
  baseURL: process.env.MITRA_BASE_URL,
  token: process.env.MITRA_TOKEN,
  integrationURL: process.env.MITRA_BASE_URL_INTEGRATIONS,
});

const projectId = Number(process.env.MITRA_PROJECT_ID);

/** Extrai o corpo de uma funcao JS para publicar como codigo da server function. */
function source(fn) {
  const text = fn.toString();
  return text.slice(text.indexOf('{') + 1, text.lastIndexOf('}')).trim();
}

/* ─────────────── fragmentos SQL reusados ─────────────── */

// Usuario da sessao: `:VAR_USER` e o ID em INT_USER de quem chamou. Quando o
// projeto tem tabela propria de usuarios, case por e-mail via INT_USER.DESCR —
// nunca por e-mail vindo no input (seria identidade escolhida por quem chama).
const SESSAO_EMAIL = `(SELECT IU.DESCR FROM INT_USER IU WHERE IU.ID = :VAR_USER)`;

// Filtro desligado = '' no texto e 0 no numerico. O Mitra troca `{{x}}` por
// texto ANTES do parse: numerico vazio viraria `COL = ` (erro de sintaxe).
const FILTROS = `
  AND ('{{status}}' = '' OR E.STATUS = '{{status}}')
  AND ('{{busca}}' = '' OR E.TITULO LIKE CONCAT('%', '{{busca}}', '%'))`;

/* ─────────────── definicoes ─────────────── */

export const definitions = [
  {
    name: 'appUsuarioSessao',
    type: 'SQL',
    description: 'Usuario da sessao pelo INT_USER. Sem parametros.',
    code: `SELECT IU.ID, IU.NOME, IU.DESCR AS EMAIL, IU.ACCESS_LEVEL
FROM INT_USER IU
WHERE IU.ID = :VAR_USER
LIMIT 1`,
  },
  {
    name: 'appExemploListar',
    type: 'SQL',
    description: 'Lista paginada. Params: busca string, status string, limite int, offset int.',
    code: `SELECT E.ID, E.TITULO, E.STATUS, E.CRIADO_EM
FROM EXEMPLO E
WHERE 1 = 1${FILTROS}
ORDER BY E.CRIADO_EM DESC
LIMIT {{limite}} OFFSET {{offset}}`,
  },
  {
    name: 'appExemploTotal',
    type: 'SQL',
    description: 'Total para a paginacao, com os mesmos filtros da listagem.',
    code: `SELECT COUNT(*) AS TOTAL
FROM EXEMPLO E
WHERE 1 = 1${FILTROS}`,
  },
  {
    // Escrita simples: uma SF SQL por instrucao. E o caminho que funciona
    // para usuario business (runDml de dentro de JS herda o bloqueio).
    name: 'appExemploInserir',
    type: 'SQL',
    description: 'Insere um item. Params: titulo string, criadoEm ISO-19.',
    code: `INSERT INTO EXEMPLO (TITULO, STATUS, CRIADO_EM, ATUALIZADO_EM)
VALUES ('{{titulo}}', 'aberto', '{{criadoEm}}', '{{criadoEm}}')`,
  },
  {
    // Regra com validacao: JAVASCRIPT le com runQueryMitra e grava chamando
    // uma SF SQL de escrita por id (o id so existe depois de publicar — veja
    // references/publicacao.md, "JS que chama outra SF").
    name: 'appExemploValidarTitulo',
    type: 'JAVASCRIPT',
    description: 'Valida titulo (unico, ate 180) e devolve { ok, error? }. Params: titulo string.',
    code: source(async function corpo() {
      const { runQueryMitra } = require('mitra-sdk');
      const projectId = Number(process.env.MITRA_PROJECT_ID);
      const titulo = String(event.titulo || '').trim();
      if (!titulo) return { ok: false, error: 'Informe o título.' };
      if (titulo.length > 180) return { ok: false, error: 'Título com mais de 180 caracteres.' };
      const seguro = titulo.replace(/'/g, "''");
      const res = await runQueryMitra({ projectId, sql: `SELECT ID FROM EXEMPLO WHERE TITULO = '${seguro}' LIMIT 1` });
      const rows = res?.result?.rows ?? [];
      if (rows.length) return { ok: false, error: 'Já existe um item com esse título.' };
      return { ok: true };
    }),
  },
];

/* ─────────────── publicacao ─────────────── */

function isEntrypoint() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

function functionId(item) {
  return item?.id ?? item?.serverFunctionId ?? item?.result?.serverFunctionId ?? item?.result?.id;
}

export async function upsert() {
  const lista = await listServerFunctionsMitra({ projectId });
  const porNome = new Map((lista?.result ?? []).map((fn) => [fn.name, fn]));
  const ids = {};

  for (const definition of definitions) {
    const existente = porNome.get(definition.name);
    if (existente) {
      const id = functionId(existente);
      await updateServerFunctionMitra({
        projectId, serverFunctionId: id, code: definition.code, description: definition.description,
        ...(definition.jdbcId ? { jdbcId: definition.jdbcId } : {}),
        ...(definition.cronExpression ? { cronExpression: definition.cronExpression } : {}),
      });
      console.log(`  atualizada  ${definition.name} (${id})`);
      ids[definition.name] = id;
      continue;
    }
    const criada = await createServerFunctionMitra({
      projectId, name: definition.name, type: definition.type, code: definition.code,
      description: definition.description,
      ...(definition.jdbcId ? { jdbcId: definition.jdbcId } : {}),
      ...(definition.cronExpression ? { cronExpression: definition.cronExpression } : {}),
    });
    const id = functionId(criada);
    console.log(`  criada      ${definition.name} (${id})`);
    ids[definition.name] = id;
  }
  return ids;
}

if (isEntrypoint()) {
  if (!projectId) throw new Error('MITRA_PROJECT_ID ausente no .env');
  console.log(`Publicando ${definitions.length} server functions (spec 001)...`);
  const ids = await upsert();
  console.log('');
  console.log('Pronto. Rode `npm run sync:function-map` para levar os ids ao frontend.');
  console.log(`Funcoes: ${Object.keys(ids).length}`);
}
