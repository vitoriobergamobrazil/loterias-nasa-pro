// ===================================================================
// CONFERÊNCIA DE BILHETES - resultado oficial da Caixa
// ===================================================================
// A conferência anterior comparava TODO bilhete com baseConcursosMega[0]:
// um concurso hardcoded de 28/11/2024, ignorando a data que o usuário
// escolheu ao salvar. Bilhetes de outras datas podiam ser marcados como
// premiados por coincidência com um sorteio antigo.
//
// Princípio: só existem dois desfechos honestos — conferido contra o
// concurso certo, ou declaradamente não conferido. "Não premiado" só é
// escrito depois de comparar com o resultado oficial daquela data.

const CONFERENCIA_CONFIG = {
  get functionUrl() {
    const base = window.NASA_SUPABASE_CONFIG?.url;
    return base ? `${base}/functions/v1/fetch-resultado` : null;
  }
};

// Faixas premiadas por modalidade (mínimo de acertos que paga prêmio)
const FAIXAS_PREMIACAO = {
  megasena: [
    { acertos: 6, rotulo: '🏆 SENA' },
    { acertos: 5, rotulo: '🥈 QUINA' },
    { acertos: 4, rotulo: '🥉 QUADRA' }
  ],
  lotofacil: [
    { acertos: 15, rotulo: '🏆 15 PONTOS' },
    { acertos: 14, rotulo: '14 Pontos' },
    { acertos: 13, rotulo: '13 Pontos' },
    { acertos: 12, rotulo: '12 Pontos' },
    { acertos: 11, rotulo: '11 Pontos' }
  ]
};

const STATUS = {
  aguardando: '⏳ Aguardando sorteio',
  indisponivel: '⚠️ Não foi possível conferir',
  naoPremiado: 'Não premiado'
};

// Evita repetir a mesma consulta para vários bilhetes da mesma data.
const cacheResultados = new Map();

async function obterResultadoOficial(modalidade, dataBR) {
  const chave = `${modalidade}|${dataBR}`;
  if (cacheResultados.has(chave)) return cacheResultados.get(chave);

  // Consulta direta ao portal da Caixa: ele libera CORS e responde ao
  // navegador do usuário, que está no Brasil. A Edge Function equivalente
  // não serve aqui porque a Caixa recusa conexão dos datacenters do Supabase.
  const resultado =
    typeof buscarConcursoPorData === 'function'
      ? await buscarConcursoPorData(modalidade, dataBR)
      : null;

  cacheResultados.set(chave, resultado);
  return resultado;
}

function dataBRNoFuturo(dataBR) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((dataBR || '').trim());
  if (!partes) return false;

  const [, dia, mes, ano] = partes;
  const alvo = new Date(Number(ano), Number(mes) - 1, Number(dia), 23, 59, 59);
  return alvo.getTime() > Date.now();
}

function premioDaFaixa(resultado, acertos) {
  const faixa = (resultado.rateio || []).find((f) => f.acertos === acertos);
  return faixa ? Number(faixa.premio) || 0 : 0;
}

function avaliarBilhete(bilhete, resultado) {
  const sorteadas = resultado.dezenas || [];
  const acertos = sorteadas.filter((d) => bilhete.dezenas.includes(d)).length;
  const faixas = FAIXAS_PREMIACAO[bilhete.modalidade] || [];
  const faixa = faixas.find((f) => f.acertos === acertos);

  return {
    acertos,
    dezenasSorteadas: sorteadas,
    concursoConferido: resultado.concurso,
    premioGanho: faixa ? premioDaFaixa(resultado, acertos) : 0,
    status: faixa ? faixa.rotulo : STATUS.naoPremiado,
    premiado: Boolean(faixa)
  };
}

async function conferirTodosBilhetesSalvos() {
  if (!Array.isArray(carteiraJogos) || carteiraJogos.length === 0) {
    toast('Nenhum bilhete na carteira.', '⚠️');
    tocarBeep('alert');
    return;
  }

  tocarBeep('click');
  toast('🔍 Consultando resultados oficiais da Caixa...', '📡');
  cacheResultados.clear();

  let premiados = 0;
  let conferidos = 0;
  let aguardando = 0;
  let indisponiveis = 0;

  for (const bilhete of carteiraJogos) {
    if (dataBRNoFuturo(bilhete.data)) {
      bilhete.conferido = false;
      bilhete.status = STATUS.aguardando;
      bilhete.premioGanho = 0;
      aguardando++;
      continue;
    }

    const resultado = await obterResultadoOficial(bilhete.modalidade, bilhete.data);

    if (!resultado) {
      // Sem resultado oficial não se afirma nada sobre o bilhete.
      bilhete.conferido = false;
      bilhete.status = STATUS.indisponivel;
      bilhete.premioGanho = 0;
      indisponiveis++;
      continue;
    }

    const avaliacao = avaliarBilhete(bilhete, resultado);
    bilhete.conferido = true;
    bilhete.status = avaliacao.status;
    bilhete.premioGanho = avaliacao.premioGanho;
    bilhete.acertos = avaliacao.acertos;
    bilhete.concursoConferido = avaliacao.concursoConferido;
    bilhete.dezenasSorteadas = avaliacao.dezenasSorteadas;

    conferidos++;
    if (avaliacao.premiado) premiados++;
  }

  salvarCarteiraStorage();
  atualizarPainelCarteira();

  const partes = [];
  if (conferidos) partes.push(`${conferidos} conferido${conferidos > 1 ? 's' : ''}`);
  if (premiados) partes.push(`${premiados} premiado${premiados > 1 ? 's' : ''}`);
  if (aguardando) partes.push(`${aguardando} aguardando sorteio`);
  if (indisponiveis) partes.push(`${indisponiveis} sem resultado`);

  if (premiados > 0) {
    tocarSomNasa('sucesso');
    toast(partes.join(' • '), '🎉');
  } else if (conferidos > 0) {
    toast(partes.join(' • '), '✅');
  } else {
    toast(
      indisponiveis
        ? 'Não foi possível obter os resultados agora. Tente novamente.'
        : partes.join(' • '),
      '📌'
    );
  }
}

/** Último concurso realizado de uma modalidade, direto da Caixa. */
async function obterUltimoResultadoOficial(modalidade) {
  return typeof buscarConcursoCaixa === 'function'
    ? await buscarConcursoCaixa(modalidade)
    : null;
}

/** Converte o retorno da Caixa para o formato usado por baseConcursos*. */
function montarRegistroConcurso(resultado) {
  const premio = (acertos) => {
    const faixa = (resultado.rateio || []).find((f) => f.acertos === acertos);
    return faixa ? Number(faixa.premio) || 0 : 0;
  };

  const registro = {
    concurso: resultado.concurso,
    data: resultado.data,
    dezenas: resultado.dezenas,
    acumulado: Boolean(resultado.acumulado)
  };

  if (resultado.modalidade === 'megasena') {
    registro.premioSena = premio(6);
    registro.premioQuina = premio(5);
    registro.premioQuadra = premio(4);
  } else {
    registro.premio15 = premio(15);
  }

  return registro;
}

window.conferencia = {
  conferir: conferirTodosBilhetesSalvos,
  resultado: obterResultadoOficial,
  ultimo: obterUltimoResultadoOficial,
  limparCache: () => cacheResultados.clear()
};

console.log('🎟️ Conferência oficial carregada');
