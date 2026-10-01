// Schema do projeto — spec 001-<slug>.
//
// NAO EXECUTE ESTE ARQUIVO DA MAQUINA LOCAL sem decisao explicita do usuario.
// O mitra-sdk e um cliente HTTP puro e nao gera migration; quem materializa a
// migration e a plataforma, ao fim de um turno no sandbox. Rodar daqui aplica
// o DDL em producao sem migration, e a historia diverge do schema.
//
// Uso (no sandbox): cd backend && node setup-backend.mjs
//
// Todo CREATE e "IF NOT EXISTS" e todo seed e guardado por SELECT: rodar duas
// vezes nao apaga nem duplica nada. O simulador local (backend/simulator) le
// os DDLs deste arquivo para montar o banco SQLite — mantenha cada tabela num
// template literal proprio (um `await ddl(...)` por tabela) e nao escreva a
// frase de abertura do DDL em comentarios, porque o leitor e por texto.

import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { configureSdkMitra, runDdlMitra, runDmlMitra, runQueryMitra } from 'mitra-sdk';

configureSdkMitra({
  baseURL: process.env.MITRA_BASE_URL,
  token: process.env.MITRA_TOKEN,
  integrationURL: process.env.MITRA_BASE_URL_INTEGRATIONS,
});

const projectId = Number(process.env.MITRA_PROJECT_ID);
const agora = () => new Date().toISOString().slice(0, 19);

/** Escapa texto para SQL montado por concatenacao (so para DML/SELECT daqui). */
function esc(valor, max = 500) {
  return String(valor ?? '').trim().slice(0, max).replace(/\\/g, '\\\\').replace(/'/g, "''");
}

function linhas(resposta) {
  let saida = resposta?.result ?? resposta;
  if (typeof saida === 'string') { try { saida = JSON.parse(saida); } catch { return []; } }
  if (saida?.output) saida = saida.output;
  if (typeof saida === 'string') { try { saida = JSON.parse(saida); } catch { return []; } }
  return saida?.rows ?? saida?.result?.rows ?? saida?.result ?? [];
}

const ddl = (sql) => runDdlMitra({ projectId, sql });
const dml = (sql) => runDmlMitra({ projectId, sql });
const query = async (sql) => linhas(await runQueryMitra({ projectId, sql }));

/* ─────────────── tabelas ─────────────── */

async function criarTabelas() {
  // Regras de modelagem que o Mitra impoe (references/plataforma-mitra.md):
  //  - ID INT AUTO_INCREMENT PRIMARY KEY, colunas em CAIXA_ALTA
  //  - datas em VARCHAR(10) ('AAAA-MM-DD') ou VARCHAR(19) ('AAAA-MM-DDTHH:MM:SS'),
  //    nunca DATE/TIMESTAMP (o REST nao deserializa); preencha no codigo
  //  - BOOLEAN DEFAULT TRUE/FALSE funciona
  //  - indices inline (INDEX/UNIQUE KEY) e FOREIGN KEY funcionam
  await ddl(`CREATE TABLE IF NOT EXISTS EXEMPLO (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    TITULO VARCHAR(180) NOT NULL,
    STATUS VARCHAR(30) NOT NULL DEFAULT 'aberto',
    RESPONSAVEL_ID INT NULL,
    CRIADO_EM VARCHAR(19),
    ATUALIZADO_EM VARCHAR(19),
    INDEX IDX_EXEMPLO_STATUS (STATUS)
  );`);
}

/* ─────────────── dados iniciais ─────────────── */

// Dado de NEGOCIO inicial (parametros, listas fixas). Nunca dado de teste:
// isto roda em producao.
const EXEMPLOS_INICIAIS = [
  // { titulo: 'Primeiro item', status: 'aberto' },
];

async function semear() {
  for (const item of EXEMPLOS_INICIAIS) {
    const existe = await query(`SELECT ID FROM EXEMPLO WHERE TITULO = '${esc(item.titulo)}' LIMIT 1`);
    if (existe.length) continue;
    await dml(`INSERT INTO EXEMPLO (TITULO, STATUS, CRIADO_EM, ATUALIZADO_EM)
      VALUES ('${esc(item.titulo)}', '${esc(item.status)}', '${agora()}', '${agora()}')`);
  }
}

/* ─────────────── entrypoint ─────────────── */

/** So executa quando chamado direto — o simulador importa este arquivo para ler o DDL. */
function isEntrypoint() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

async function main() {
  if (!projectId) throw new Error('MITRA_PROJECT_ID ausente no .env');
  console.log(`Setup do backend no projeto ${projectId}...`);
  await criarTabelas();
  console.log('  tabelas ok');
  await semear();
  console.log('  dados iniciais ok');
  console.log('Pronto.');
}

if (isEntrypoint()) {
  main().catch((erro) => { console.error(erro); process.exit(1); });
}
