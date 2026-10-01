// Configuracao do simulador local do Mitra.
//
// Este e o UNICO arquivo do simulador que muda de projeto para projeto. Os
// demais (runtime, server, schema, mysql-dialect, check) sao genericos: eles
// leem daqui a porta, a ordem dos scripts de publicacao, de onde vem o schema
// e onde esta o mapa de ids do frontend.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

/* ── identidade ── */

// Nome exibido no login e no /health.
export const PROJECT_LABEL = 'NOME DO PROJETO — Simulador local';

// Semente do gerador de dados. Use o numero do projeto (p-NNNNN) para que o
// banco saia sempre igual e um numero divergente numa tela seja bug, nao sorte.
export const SEED = 10000;

/* ── rede ── */

// Cada projeto na mesma maquina precisa de uma porta propria. Convencao:
// 3001 = mitra-simulator generico (nao serve estes apps); 3101, 3102, 3103,
// 3104 ja estao em uso pelos projetos registrados no mitra-hub. Pegue a
// proxima livre e registre no hub (mitra-hub/server.mjs) e no frontend
// (VITE_MITRA_BASE_URL / DEFAULT no mitra-auth.ts).
export const PORT = Number(process.env.SIMULATOR_PORT || 3105);
export const PROJECT_ID = Number(process.env.SIMULATOR_PROJECT_ID || 1);

// Senha unica para qualquer usuario do banco simulado.
export const DEFAULT_PASSWORD = process.env.SIMULATOR_PASSWORD || 'mitra123';

/* ── banco ── */

export const DB_PATH = process.env.SIMULATOR_DB_PATH || join(HERE, 'data', 'mitra-sim.db');

// Arquivos de onde o schema e LIDO (nao copiado): todo `CREATE TABLE IF NOT
// EXISTS ...` em template literal dentro deles vira tabela SQLite no seed.
export const DDL_SOURCES = [join(HERE, '..', 'setup-backend.mjs')];

// Tabela contada no /health como sinal de vida do banco.
export const HEALTH_TABLE = 'INT_USER';

/* ── server functions ── */

// Scripts de publicacao (backend/add-*.mjs), na ordem em que sao publicados
// no Mitra. Cada um exporta `definitions`; a ultima definicao do mesmo nome
// vence — como na plataforma.
export const PUBLISH_ORDER = ['add-001-funcoes.mjs'];

// Mapa de ids do frontend. O simulador responde exatamente aos ids que a
// tela usa, antes e depois de o sync trazer os ids reais da plataforma.
export const FRONTEND_MAP = join(HERE, '..', '..', 'frontend', 'src', 'lib', 'server-functions.ts');
export const MAP_NAMES = 'SERVER_FUNCTION_NAMES';
export const MAP_IDS = 'SERVER_FUNCTIONS';

// Entrada plausivel para o `sim:check` executar as funcoes SQL de leitura.
// Filtro desligado e '' no texto e '0' no numerico (ver references/plataforma-mitra.md).
export const CHECK_INPUT = {
  busca: '', limite: '20', offset: '0', pagina: '0',
  dataInicio: '', dataFim: '', id: '1', status: '',
};
