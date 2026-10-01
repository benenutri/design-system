// Mapa das server functions do projeto.
//
// SERVER_FUNCTION_NAMES e escrito a mao e e o contrato com `backend/add-*.mjs`:
// mudou o nome la, muda aqui.
//
// SERVER_FUNCTIONS sao os ids da plataforma. Antes de publicar, os valores
// sao os do simulador local (qualquer numero unico serve); depois de publicar
// no Mitra, `cd backend && npm run sync:function-map` reescreve este bloco
// com os ids reais. O simulador resolve pelo NOME, entao funciona antes e depois.
//
// Formato dos dois blocos e rigido (uma linha `chave: 'valor',` por entrada,
// sem comentario dentro): o sync e o simulador fazem parse por texto.

export const SERVER_FUNCTION_NAMES = {
  usuarioSessao: 'appUsuarioSessao',
  exemploListar: 'appExemploListar',
  exemploTotal: 'appExemploTotal',
  exemploInserir: 'appExemploInserir',
  exemploValidarTitulo: 'appExemploValidarTitulo',
};

export const SERVER_FUNCTIONS = {
  usuarioSessao: '1',
  exemploListar: '2',
  exemploTotal: '3',
  exemploInserir: '4',
  exemploValidarTitulo: '5',
};
