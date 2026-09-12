// ===================================================================
// SORTEIOS - Calendário calculado + prêmio/concurso de fonte real
// ===================================================================
// REGRA FUNDAMENTAL: dia e horário do sorteio são determinísticos e
// podem ser calculados. Prêmio estimado e número do concurso NÃO —
// só aparecem se vierem de fonte real (Supabase). Sem fonte, a UI
// mostra "—". Nunca inventar valor de prêmio: além de enganar o
// usuário, é publicidade enganosa (CDC art. 37).

const SORTEIOS_CONFIG = {
  // Derivado da config do Supabase; evita project-id hardcoded errado
  get functionUrl() {
    const base = window.NASA_SUPABASE_CONFIG?.url;
    return base ? `${base}/functions/v1/fetch-sorteios` : null;
  },
  autoRefreshMs: 30 * 60 * 1000
};

const SORTEIOS_CALENDARIO = {
  // 0=domingo, 1=segunda ... 6=sábado
  megasena: { dias: [3, 6], hora: 20 },
  lotofacil: { dias: [1, 2, 3, 4, 5, 6], hora: 20 }
};

const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/**
 * Próximo sorteio de uma modalidade a partir de `agora`.
 * Se hoje é dia de sorteio e ainda não passou do horário, retorna "Hoje".
 */
function calcularProximoSorteio(modalidade, agora = new Date()) {
  const cfg = SORTEIOS_CALENDARIO[modalidade];
  if (!cfg) return { dia: '—', hora: '20h' };

  const hojeEhDiaDeSorteio = cfg.dias.includes(agora.getDay());
  const aindaDaTempoHoje = agora.getHours() < cfg.hora;

  if (hojeEhDiaDeSorteio && aindaDaTempoHoje) {
    return { dia: 'Hoje', hora: `${cfg.hora}h` };
  }

  for (let i = 1; i <= 7; i++) {
    const candidato = (agora.getDay() + i) % 7;
    if (cfg.dias.includes(candidato)) {
      const dia = i === 1 ? 'Amanhã' : NOMES_DIAS[candidato];
      return { dia, hora: `${cfg.hora}h` };
    }
  }

  return { dia: '—', hora: `${cfg.hora}h` };
}

function formatarPremio(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) return '—';
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });
}

/**
 * Escreve na UI. `dados` é sempre {megasena: {...}, lotofacil: {...}},
 * onde premio/concurso podem ser null (vira "—" e não um número falso).
 */
function atualizarSorteiosUI(dados, origem = 'calculado') {
  const mapa = [
    { chave: 'megasena', idPremio: 'cal-mega-premio', idConcurso: 'cal-mega-concurso' },
    { chave: 'lotofacil', idPremio: 'cal-loto-premio', idConcurso: 'cal-loto-concurso' }
  ];

  mapa.forEach(({ chave, idPremio, idConcurso }) => {
    const info = dados?.[chave];
    if (!info) return;

    const elPremio = document.getElementById(idPremio);
    if (elPremio) {
      elPremio.innerText = formatarPremio(info.premio);
      elPremio.title = info.premio
        ? 'Estimativa oficial sincronizada'
        : 'Estimativa indisponível — consulte o site da Caixa';
    }

    const elConcurso = document.getElementById(idConcurso);
    if (elConcurso) {
      const prefixo = info.concurso ? `Conc. ${info.concurso} • ` : '';
      elConcurso.innerText = `${prefixo}${info.dia} ${info.hora}`;
    }
  });

  const elTimestamp = document.getElementById('sorteios-ultima-sync');
  if (elTimestamp) {
    const hora = new Date().toLocaleTimeString('pt-BR');
    elTimestamp.innerText = origem === 'servidor'
      ? `Atualizado às ${hora}`
      : `Calendário local • ${hora}`;
    elTimestamp.classList.remove('hidden');
  }
}

/** Base sempre confiável: dias corretos, prêmio/concurso vazios. */
function montarCalendarioLocal(agora = new Date()) {
  const mega = calcularProximoSorteio('megasena', agora);
  const loto = calcularProximoSorteio('lotofacil', agora);

  return {
    megasena: { ...mega, premio: null, concurso: null },
    lotofacil: { ...loto, premio: null, concurso: null },
    atualizadoEm: agora.toISOString()
  };
}

/** Mescla dados reais (prêmio/concurso) sobre o calendário calculado. */
function mesclarDadosServidor(linhas, agora = new Date()) {
  const base = montarCalendarioLocal(agora);

  linhas.forEach((linha) => {
    const chave = linha.modalidade;
    if (!base[chave]) return;
    base[chave].premio = linha.premio_estimado ?? null;
    base[chave].concurso = linha.proximo_concurso ?? null;
  });

  return base;
}

function salvarUltimoSorteio(dados) {
  try {
    localStorage.setItem(
      'sorteios_ultima_sincronizacao',
      JSON.stringify({ ...dados, atualizadoEm: new Date().toISOString() })
    );
  } catch (err) {
    console.warn('Não foi possível salvar sorteios:', err);
  }
}

function obterSorteiosSalvos() {
  try {
    const salvos = localStorage.getItem('sorteios_ultima_sincronizacao');
    return salvos ? JSON.parse(salvos) : null;
  } catch (err) {
    console.warn('Não foi possível ler sorteios salvos:', err);
    return null;
  }
}

async function sincronizarSorteiosReais({ silencioso = false } = {}) {
  if (!silencioso) {
    tocarBeep('click');
    toast('🔄 Buscando sorteios da Caixa...', '📡');
  }

  const agora = new Date();

  // Calendário é confiável offline: pinta primeiro pra nunca ficar vazio.
  atualizarSorteiosUI(montarCalendarioLocal(agora), 'calculado');

  // 1) Cache no Supabase (alimentado pela Edge Function)
  try {
    const cliente = obterClienteSupabase();
    if (cliente) {
      const { data, error } = await cliente.from('sorteios_cache').select('*');
      if (!error && data?.length) {
        const dados = mesclarDadosServidor(data, agora);
        atualizarSorteiosUI(dados, 'servidor');
        salvarUltimoSorteio(dados);
        if (!silencioso) {
          tocarSomNasa('sucesso');
          toast('✅ Sorteios atualizados', '🎯');
        }
        return;
      }
      if (error) console.warn('sorteios_cache indisponível:', error.message);
    }
  } catch (err) {
    console.warn('Supabase indisponível:', err.message);
  }

  // 2) Edge Function direta
  try {
    const url = SORTEIOS_CONFIG.functionUrl;
    if (url) {
      const resposta = await fetch(url);
      if (resposta.ok) {
        const linhas = await resposta.json();
        if (Array.isArray(linhas) && linhas.length) {
          const dados = mesclarDadosServidor(linhas, agora);
          atualizarSorteiosUI(dados, 'servidor');
          salvarUltimoSorteio(dados);
          if (!silencioso) {
            tocarSomNasa('sucesso');
            toast('✅ Sorteios atualizados', '🎯');
          }
          return;
        }
      }
    }
  } catch (err) {
    console.warn('Edge Function indisponível:', err.message);
  }

  // 3) Último cache local: reaproveita prêmio/concurso, recalcula os dias
  const salvos = obterSorteiosSalvos();
  if (salvos?.megasena?.premio || salvos?.lotofacil?.premio) {
    const dados = montarCalendarioLocal(agora);
    dados.megasena.premio = salvos.megasena?.premio ?? null;
    dados.megasena.concurso = salvos.megasena?.concurso ?? null;
    dados.lotofacil.premio = salvos.lotofacil?.premio ?? null;
    dados.lotofacil.concurso = salvos.lotofacil?.concurso ?? null;
    atualizarSorteiosUI(dados, 'servidor');

    if (!silencioso) {
      const minutos = Math.floor((Date.now() - new Date(salvos.atualizadoEm)) / 60000);
      toast(`ℹ️ Prêmios de ${minutos} min atrás (offline)`, '📌');
    }
    return;
  }

  // 4) Sem nenhuma fonte: datas corretas, prêmio "—" e aviso honesto
  if (!silencioso) {
    toast('ℹ️ Datas confirmadas. Prêmios indisponíveis no momento.', '📌');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  atualizarSorteiosUI(montarCalendarioLocal(), 'calculado');

  setTimeout(() => {
    sincronizarSorteiosReais({ silencioso: true });
    setInterval(
      () => sincronizarSorteiosReais({ silencioso: true }),
      SORTEIOS_CONFIG.autoRefreshMs
    );
  }, 1500);
});

window.sorteios = {
  sincronizar: sincronizarSorteiosReais,
  ultimos: obterSorteiosSalvos,
  calendarioLocal: () => atualizarSorteiosUI(montarCalendarioLocal(), 'calculado')
};

console.log('🎯 Sorteios carregado. Debug: window.sorteios.sincronizar()');
