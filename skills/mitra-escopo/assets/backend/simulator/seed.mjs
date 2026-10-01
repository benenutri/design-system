// Dados simulados do projeto.
//
// O SCHEMA nao esta aqui: sai dos scripts de backend via schema.mjs. O que
// vive neste arquivo e so o DADO — usuarios e registros do dominio espalhados
// pelos estados que as specs descrevem, para que cada cenario tenha um caso
// no banco (um atrasado, um encerrado, um vazio...).
//
// Geracao deterministica (semente fixa em config.mjs): o mesmo banco sai
// sempre igual, entao numero divergente numa tela e bug de codigo, nunca sorte
// do dado. As DATAS sao relativas a hoje, de proposito: um registro atrasado
// precisa continuar atrasado amanha.

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { createSchema } from './schema.mjs';
import { SEED } from './config.mjs';

/** PRNG deterministico — nada de Math.random no seed. */
function rng(semente) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIA = 86400000;
export const iso = (data) => data.toISOString().slice(0, 19);
export const dia = (data) => data.toISOString().slice(0, 10);
export const maisDias = (base, dias) => new Date(base.getTime() + dias * DIA);

// Usuarios da plataforma (INT_USER). Ao menos um ADMIN. Os e-mails aqui sao os
// logins do simulador (senha unica em config.mjs) e do painel do mitra-hub.
export const USUARIOS = [
  { nome: 'Admin Local', email: 'admin@empresa.local', accessLevel: 'ADMIN' },
  { nome: 'Gestora Local', email: 'gestora@empresa.local', accessLevel: 'MEMBER' },
  { nome: 'Operador Local', email: 'operador@empresa.local', accessLevel: 'MEMBER' },
];

export function seedDatabase(dbPath, { reset = false } = {}) {
  if (reset) {
    for (const sufixo of ['', '-wal', '-shm']) rmSync(`${dbPath}${sufixo}`, { force: true });
  }
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
  createSchema(db);

  const aleatorio = rng(SEED);
  const escolher = (lista) => lista[Math.floor(aleatorio() * lista.length)];
  const hoje = new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00Z`);
  const counts = {};

  /* ── INT_USER ── */
  const inserirUsuario = db.prepare('INSERT INTO INT_USER (DESCR, NOME, ACCESS_LEVEL, ATIVO) VALUES (?, ?, ?, 1)');
  for (const usuario of USUARIOS) inserirUsuario.run(usuario.email, usuario.nome, usuario.accessLevel);
  counts.INT_USER = USUARIOS.length;

  /* ── dominio ──
   *
   * Substitua o exemplo abaixo pelas tabelas do projeto. Regras que valem a
   * pena manter:
   *  - cubra cada cenario da spec com pelo menos um registro (C-001, C-002...);
   *  - datas relativas a `hoje` (maisDias(hoje, -7)), nunca literais;
   *  - colunas de data em texto ISO (iso()/dia()), como o Mitra grava;
   *  - use `escolher()`/`aleatorio()` para variar, nunca Math.random.
   */
  // const inserirItem = db.prepare('INSERT INTO ITEM (TITULO, STATUS, CRIADO_EM) VALUES (?, ?, ?)');
  // for (let i = 1; i <= 30; i += 1) {
  //   inserirItem.run(`Item ${i}`, escolher(['aberto', 'em_andamento', 'concluido']), iso(maisDias(hoje, -i)));
  // }
  // counts.ITEM = 30;

  db.close();
  return counts;
}
