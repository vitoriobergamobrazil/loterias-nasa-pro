// ===================================================================
// API DA CAIXA - acesso direto do navegador
// ===================================================================
// O portal da Caixa envia Access-Control-Allow-Origin: *, então o navegador
// pode consultá-lo sem servidor no meio. E foi preciso: a Caixa recusa
// conexão vinda dos datacenters do Supabase, então a Edge Function que eu
// havia escrito para isso não funciona — de dentro do Brasil, que é onde
// está o usuário, funciona.
//
// Este módulo é a única porta de entrada para dados de loteria no cliente.
// Quem precisa de resultado ou prêmio chama daqui.

const CAIXA_API = {
  base: 'https://servicebus2.caixa.gov.br/portaldeloterias/api',
  timeoutMs: 12000,
  // 0=domingo ... 6=sábado
  calendario: {
    megasena: { dias: [3, 6], hora: 20 },
    lotofacil: { dias: [1, 2, 3, 4, 5, 6], hora: 20 }
  }
};

const cacheCaixa = new Map();

function dataBRParaDate(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(texto || '').trim());
  if (!m) return null;
  const data = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(data.getTime()) ? null : data;
}

function normalizarConcurso(dados, modalidade) {
  const dezenas = (dados?.listaDezenas ?? []).map(Number).filter(Number.isFinite);
  const numero = Number(dados?.numero);

  // Concurso ainda não sorteado vem sem dezenas.
  if (!dezenas.length || !Number.isFinite(numero)) return null;

  return {
    modalidade,
    concurso: numero,
    data: String(dados?.dataApuracao ?? ''),
    dezenas: dezenas.sort((a, b) => a - b),
    acumulado: Boolean(dados?.acumulado),
    proximoConcurso: Number(dados?.numeroConcursoProximo) || null,
    premioProximo: Number(dados?.valorEstimadoProximoConcurso) || null,
    rateio: (dados?.listaRateioPremio ?? []).map((f) => ({
      acertos: Number(String(f?.descricaoFaixa ?? '').replace(/\D/g, '')) || 0,
      ganhadores: Number(f?.numeroDeGanhadores) || 0,
      premio: Number(f?.valorPremio) || 0
    }))
  };
}

async function buscarConcursoCaixa(modalidade, concurso = null) {
  const chave = `${modalidade}|${concurso ?? 'ultimo'}`;
  if (cacheCaixa.has(chave)) return cacheCaixa.get(chave);

  const url = concurso
    ? `${CAIXA_API.base}/${modalidade}/${concurso}`
    : `${CAIXA_API.base}/${modalidade}`;

  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), CAIXA_API.timeoutMs);

  try {
    const resposta = await fetch(url, {
      signal: controle.signal,
      headers: { Accept: 'application/json' }
    });

    if (!resposta.ok) return null;

    const resultado = normalizarConcurso(await resposta.json(), modalidade);

    // Concurso passado nunca muda: cachear evita reconsulta na mesma sessão.
    if (resultado && concurso) cacheCaixa.set(chave, resultado);

    return resultado;
  } catch (err) {
    console.warn(`Caixa indisponível (${modalidade}/${concurso ?? 'último'}):`, err.message);
    return null;
  } finally {
    clearTimeout(limite);
  }
}

/** Quantos sorteios da modalidade existem entre duas datas. */
function contarSorteiosEntre(de, ate, modalidade) {
  const cfg = CAIXA_API.calendario[modalidade];
  if (!cfg) return 0;

  const inicio = new Date(de);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(ate);
  fim.setHours(0, 0, 0, 0);

  const sentido = fim >= inicio ? 1 : -1;
  let total = 0;
  const cursor = new Date(inicio);

  for (let i = 0; i < 4000; i++) {
    cursor.setDate(cursor.getDate() + sentido);
    if (cfg.dias.includes(cursor.getDay())) total += sentido;
    if (cursor.getTime() === fim.getTime()) break;
  }

  return total;
}

/**
 * Encontra o concurso de uma data (dd/mm/aaaa).
 * Estima pelo calendário fixo e confere contra a data que a Caixa devolve,
 * corrigindo quando feriado ou sorteio especial desloca a numeração.
 */
async function buscarConcursoPorData(modalidade, dataBR) {
  const alvo = dataBRParaDate(dataBR);
  if (!alvo) return null;

  const ultimo = await buscarConcursoCaixa(modalidade);
  if (!ultimo) return null;

  const dataUltimo = dataBRParaDate(ultimo.data);
  if (!dataUltimo) return null;

  if (dataUltimo.getTime() === alvo.getTime()) return ultimo;
  if (alvo > dataUltimo) return null; // sorteio ainda não aconteceu

  let estimativa = ultimo.concurso - contarSorteiosEntre(alvo, dataUltimo, modalidade);

  for (let tentativa = 0; tentativa <= 4; tentativa++) {
    if (estimativa < 1) return null;

    const candidato = await buscarConcursoCaixa(modalidade, estimativa);
    if (!candidato) return null;

    const dataCandidato = dataBRParaDate(candidato.data);
    if (!dataCandidato) return null;
    if (dataCandidato.getTime() === alvo.getTime()) return candidato;

    estimativa += dataCandidato > alvo ? -1 : 1;
  }

  return null;
}

window.caixaApi = {
  ultimo: buscarConcursoCaixa,
  porData: buscarConcursoPorData,
  limparCache: () => cacheCaixa.clear()
};

console.log('🏛️ API da Caixa disponível. Debug: window.caixaApi.ultimo("megasena")');
