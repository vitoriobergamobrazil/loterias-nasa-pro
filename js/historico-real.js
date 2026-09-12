// ===================================================================
// HISTÓRICO OFICIAL DE CONCURSOS
// ===================================================================
// Carrega os sorteios reais da Caixa (tabela concursos_historico, populada
// pela Edge Function sync-historico) para dentro de baseConcursosMega e
// baseConcursosLoto.
//
// Antes, gerarHistoricoInicial() fabricava os concursos 2650–2796 com
// Math.random(). O simulador de desempenho, o mapa de calor e o ranking de
// dezenas quentes/frias rodavam sobre sorteios que nunca aconteceram — o
// oposto do que o produto promete ao falar em análise estatística.
//
// Regra: sem histórico real, as bases ficam vazias. Nada de preencher.

const HISTORICO_CONFIG = {
  limite: 300,
  chaveCache: 'loterias_nasa_historico_v1',
  validadeCacheMs: 12 * 60 * 60 * 1000
};

/** "2024-11-28" -> "28/11/2024" (formato usado na UI e na carteira) */
function dataISOParaBR(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** Converte a linha do banco para o formato que as análises já esperam. */
function converterConcurso(linha) {
  const premioDaFaixa = (acertos) => {
    const faixa = (linha.rateio || []).find((f) => Number(f.acertos) === acertos);
    return faixa ? Number(faixa.premio) || 0 : 0;
  };

  const registro = {
    concurso: linha.concurso,
    data: dataISOParaBR(linha.data_apuracao),
    dezenas: (linha.dezenas || []).map(Number),
    acumulado: Boolean(linha.acumulado)
  };

  if (linha.modalidade === 'megasena') {
    registro.premioSena = premioDaFaixa(6);
    registro.premioQuina = premioDaFaixa(5);
    registro.premioQuadra = premioDaFaixa(4);
  } else {
    registro.premio15 = premioDaFaixa(15);
  }

  return registro;
}

function aplicarHistorico({ megasena, lotofacil }) {
  // As análises assumem ordem decrescente (índice 0 = concurso mais recente).
  const ordenar = (lista) => [...lista].sort((a, b) => b.concurso - a.concurso);

  if (megasena?.length) baseConcursosMega = ordenar(megasena);
  if (lotofacil?.length) baseConcursosLoto = ordenar(lotofacil);
}

function salvarCacheHistorico(dados) {
  try {
    localStorage.setItem(
      HISTORICO_CONFIG.chaveCache,
      JSON.stringify({ ...dados, salvoEm: Date.now() })
    );
  } catch (err) {
    // Histórico grande pode estourar a cota; seguir sem cache é aceitável.
    console.warn('Histórico não cacheado:', err.message);
  }
}

function lerCacheHistorico() {
  try {
    const bruto = localStorage.getItem(HISTORICO_CONFIG.chaveCache);
    if (!bruto) return null;

    const dados = JSON.parse(bruto);
    const idade = Date.now() - (dados.salvoEm || 0);
    if (idade > HISTORICO_CONFIG.validadeCacheMs) return null;

    return dados;
  } catch {
    return null;
  }
}

async function carregarHistoricoReal({ silencioso = true } = {}) {
  const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;

  if (cliente) {
    try {
      const { data, error } = await cliente
        .from('concursos_historico')
        .select('modalidade, concurso, data_apuracao, dezenas, acumulado, rateio')
        .order('concurso', { ascending: false })
        .limit(HISTORICO_CONFIG.limite);

      if (error) throw new Error(error.message);

      if (data?.length) {
        const convertidos = {
          megasena: data.filter((l) => l.modalidade === 'megasena').map(converterConcurso),
          lotofacil: data.filter((l) => l.modalidade === 'lotofacil').map(converterConcurso)
        };

        aplicarHistorico(convertidos);
        salvarCacheHistorico(convertidos);
        rerenderizarAnalises();

        if (!silencioso) {
          const total = convertidos.megasena.length + convertidos.lotofacil.length;
          toast(`${total} concursos oficiais carregados`, '📊');
        }
        return true;
      }
    } catch (err) {
      console.warn('Histórico indisponível no servidor:', err.message);
    }
  }

  // Offline ou servidor fora: reaproveita o último histórico real baixado.
  const cache = lerCacheHistorico();
  if (cache) {
    aplicarHistorico(cache);
    rerenderizarAnalises();
    if (!silencioso) toast('Histórico carregado do cache local', '📌');
    return true;
  }

  // Sem dados reais em lugar nenhum: as bases permanecem vazias de propósito.
  console.warn('Sem histórico oficial. Análises estatísticas ficam indisponíveis.');
  marcarAnalisesIndisponiveis();
  if (!silencioso) {
    toast('Histórico de concursos indisponível no momento', '⚠️');
  }
  return false;
}

function rerenderizarAnalises() {
  const tentar = (nome, ...args) => {
    try {
      if (typeof window[nome] === 'function') window[nome](...args);
    } catch (err) {
      console.warn(`Falha ao atualizar ${nome}:`, err.message);
    }
  };

  // renderizarMapaCalor() também preenche os rankings de dezenas
  // quentes/frias. O retro-teste é recalculado quando o usuário analisa
  // um jogo, então não precisa ser disparado aqui.
  tentar('renderizarMapaCalor');
  tentar('atualizarPainelCarteira');
}

/**
 * Sem histórico não há como calcular frequência, mapa de calor nem
 * retro-teste. Deixa isso explícito na tela em vez de mostrar zeros que
 * parecem resultado de análise.
 */
function marcarAnalisesIndisponiveis() {
  const aviso = `
    <div class="col-span-full p-3 rounded-xl bg-slate-950 border border-amber-800/60 text-amber-300 text-[11px] font-sans text-center">
      Histórico oficial ainda não sincronizado — análises de frequência
      indisponíveis. Elas aparecem assim que os concursos forem carregados.
    </div>
  `;

  ['grid-mapa-calor', 'ranking-pedras-quentes', 'ranking-pedras-frias', 'grade-retro-resultados']
    .forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.children.length) el.innerHTML = aviso;
    });
}

document.addEventListener('DOMContentLoaded', () => {
  // Depois do boot do app, que é quem zera as bases.
  setTimeout(() => carregarHistoricoReal({ silencioso: true }), 900);
});

window.historico = {
  carregar: () => carregarHistoricoReal({ silencioso: false }),
  total: () => ({
    megasena: baseConcursosMega?.length || 0,
    lotofacil: baseConcursosLoto?.length || 0
  }),
  limparCache: () => localStorage.removeItem(HISTORICO_CONFIG.chaveCache)
};

console.log('📊 Histórico oficial carregado. Debug: window.historico.total()');
