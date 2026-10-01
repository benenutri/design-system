// Fluxo ponta a ponta em banco descartavel — a suite de testes do backend.
//
// O check responde "o SQL roda?"; este responde "o fluxo faz a coisa certa?".
// Roda as server functions de verdade (SQL literal e corpo JAVASCRIPT
// literal dos add-*.mjs — as mesmas que sao publicadas) e verifica com assert
// o que a spec exige. Nao precisa do servidor no ar.
//
// Obrigatorio em todo projeto: cada cenario C-00N e cada regra RN-00N da spec
// que passa pelo backend ganha um `teste()` aqui, com o id no titulo. E isso
// que faz o smoke valer como evidencia de que a spec foi cumprida.
//
// Uso: cd backend && npm run sim:smoke   (ou npm test, que roda check + smoke)

import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SEED } from './config.mjs';
import { seedDatabase } from './seed.mjs';
import { registerMysqlFunctions } from './mysql-dialect.mjs';
import { loadDefinitions, createRunner } from './runtime.mjs';

const DB = join(tmpdir(), `mitra-${SEED}-smoke.db`);
rmSync(DB, { force: true });
seedDatabase(DB, { reset: true });

const db = new DatabaseSync(DB);
registerMysqlFunctions(db);
const { byName } = await loadDefinitions();
const execute = createRunner(db);

// INT_USER ids do seed (ordem de USUARIOS em seed.mjs): :VAR_USER passa a ser esse id.
const ADMIN = 1;
const chamar = (nome, input, userId = ADMIN) => {
  const definicao = byName.get(nome);
  assert.ok(definicao, `server function ${nome} nao existe em PUBLISH_ORDER`);
  return execute(definicao, input, userId);
};
const linhas = async (nome, input, userId = ADMIN) => (await chamar(nome, input, userId)).rows;
const agora = new Date().toISOString().slice(0, 19);

let feitos = 0;
const teste = async (titulo, fn) => {
  try {
    await fn();
  } catch (erro) {
    console.log(`  FALHOU  ${titulo}\n          ${erro.message}`);
    db.close();
    process.exit(1);
  }
  feitos += 1;
  console.log(`  ok  ${titulo}`);
};

/* ── Substitua os testes abaixo pelos cenarios da spec do projeto. ── */

await teste('sessao: :VAR_USER identifica quem chama, nunca o input', async () => {
  const [sessao] = await linhas('appUsuarioSessao', { email: 'invasor@empresa.local' });
  assert.equal(sessao.EMAIL, 'admin@empresa.local');
});

await teste('C-001: item valido e aceito, gravado e aparece na listagem', async () => {
  assert.deepEqual(await chamar('appExemploValidarTitulo', { titulo: 'Primeiro item' }), { ok: true });
  await chamar('appExemploInserir', { titulo: 'Primeiro item', criadoEm: agora });
  const lista = await linhas('appExemploListar', { busca: 'Primeiro', status: '', limite: 10, offset: 0 });
  assert.equal(lista.length, 1);
  assert.equal(lista[0].STATUS, 'aberto');
  const [{ TOTAL }] = await linhas('appExemploTotal', { busca: '', status: 'aberto' });
  assert.equal(Number(TOTAL), 1);
});

await teste('C-002: titulo vazio e recusado com o motivo', async () => {
  const saida = await chamar('appExemploValidarTitulo', { titulo: '   ' });
  assert.equal(saida.ok, false);
  assert.match(saida.error, /título/i);
});

await teste('RN-001: titulo repetido e recusado', async () => {
  const saida = await chamar('appExemploValidarTitulo', { titulo: 'Primeiro item' });
  assert.equal(saida.ok, false);
  assert.match(saida.error, /já existe/i);
});

await teste('filtro desligado: status vazio nao filtra; status inexistente devolve zero', async () => {
  assert.equal((await linhas('appExemploListar', { busca: '', status: '', limite: 10, offset: 0 })).length, 1);
  assert.equal((await linhas('appExemploListar', { busca: '', status: 'nada', limite: 10, offset: 0 })).length, 0);
});

console.log(`\n  ${feitos} verificacoes passaram.`);
db.close();
