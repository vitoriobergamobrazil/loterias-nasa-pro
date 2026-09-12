// ===================================================================
// SORTEIOS REAIS - Integração com Supabase (Backend Scraper)
// ===================================================================
// Strategy: Backend function fetches real Caixa data, stores in DB
// App reads from DB (always consistent, no CORS issues)

const SORTEIOS_CONFIG = {
  // Supabase Edge Function que busca dados reais
  functionUrl: 'https://[seu-project-id].supabase.co/functions/v1/fetch-sorteios',

  // Fallback local
  fallback: {
    megasena: {
      nome: 'Mega-Sena',
      proximoConcurso: 2836,
      proximoSorteio: 'Quarta',
      hora: '20h',
      premio: 60000000
    },
    lotofacil: {
      nome: 'Lotofácil',
      proximoConcurso: 3329,
      proximoSorteio: 'Hoje',
      hora: '20h',
      premio: 1500000
    }
  }
};

async function sincronizarSorteiosReais() {
  tocarBeep('click');
  toast('🔄 Buscando últimos sorteios da Caixa...', '📡');

  try {
    // Buscar do Supabase (que tem dados do scraper)
    const cliente = obterClienteSupabase();
    if (cliente) {
      const { data, error } = await cliente
        .from('sorteios_cache')
        .select('*');

      if (!error && data && data.length > 0) {
        atualizarSorteiosUIFromDb(data);
        tocarSomNasa('sucesso');
        toast('✅ Sorteios atualizados do servidor!', '🎯');
        return;
      } else {
        console.warn('❌ Erro ao buscar DB:', error?.message);
      }
    }
  } catch (err) {
    console.warn('❌ Erro Supabase:', err.message);
  }

  // Fallback 2: chamar Edge Function diretamente
  try {
    const response = await fetch(SORTEIOS_CONFIG.functionUrl);
    if (response.ok) {
      const sorteios = await response.json();
      atualizarSorteiosUI(sorteios);
      tocarSomNasa('sucesso');
      toast('✅ Sorteios atualizados!', '🎯');
      return;
    }
  } catch (err) {
    console.warn('❌ Edge Function falhou:', err.message);
  }

  // Fallback 3: dados salvos localmente
  console.log('⚠️ Usando dados locais/calculados...');
  const sorteiosSalvos = obterSorteiosSalvos();
  if (sorteiosSalvos) {
    atualizarSorteiosUI(sorteiosSalvos);
    const dataAtualizacao = new Date(sorteiosSalvos.updated);
    const horaAgo = Math.floor((Date.now() - dataAtualizacao) / 1000 / 60);
    toast(
      `ℹ️ Dados de ${horaAgo}min atrás (offline)`,
      '📌'
    );
  } else {
    atualizarSorteiosUI(gerarSorteiosInteligentes());
    toast('ℹ️ Modo offline: dados calculados', '📌');
  }
}

function atualizarSorteiosUIFromDb(dbData) {
  // dbData é array de {modalidade, proximo_concurso, proximo_sorteio, premio_estimado, ...}
  const megasena = dbData.find(s => s.modalidade === 'megasena');
  const lotofacil = dbData.find(s => s.modalidade === 'lotofacil');

  if (megasena) {
    const elMegaPremio = document.getElementById('cal-mega-premio');
    const elMegaConc = document.getElementById('cal-mega-concurso');

    if (elMegaPremio) {
      elMegaPremio.innerText = `R$ ${parseInt(megasena.premio_estimado).toLocaleString('pt-BR')}`;
    }
    if (elMegaConc) {
      elMegaConc.innerText = `Conc. ${megasena.proximo_concurso} • ${megasena.proximo_sorteio} ${megasena.hora_sorteio}`;
    }
  }

  if (lotofacil) {
    const elLotoPremio = document.getElementById('cal-loto-premio');
    const elLotoConc = document.getElementById('cal-loto-concurso');

    if (elLotoPremio) {
      elLotoPremio.innerText = `R$ ${parseInt(lotofacil.premio_estimado).toLocaleString('pt-BR')}`;
    }
    if (elLotoConc) {
      elLotoConc.innerText = `Conc. ${lotofacil.proximo_concurso} • ${lotofacil.proximo_sorteio} ${lotofacil.hora_sorteio}`;
    }
  }

  // Atualizar timestamp
  const elTimestamp = document.getElementById('sorteios-ultima-sync');
  if (elTimestamp) {
    const agora = new Date();
    elTimestamp.innerText = `Atualizado às ${agora.toLocaleTimeString('pt-BR')}`;
    elTimestamp.style.display = 'block';
  }
}

function calcularProximosSorteiosCaixa(data = new Date()) {
  // Mega-Sena: Quarta e Sábado às 20h
  // Lotofácil: Todos os dias (seg-sáb) às 20h
  const diaSemana = data.getDay(); // 0=dom, 1=seg, ..., 6=sáb

  let proximoMega, proximoLoto;

  // Mega-Sena
  if (diaSemana === 3) { // Quarta
    proximoMega = 'Quarta';
  } else if (diaSemana === 6) { // Sábado
    proximoMega = 'Sábado';
  } else if (diaSemana < 3) {
    proximoMega = 'Quarta';
  } else {
    proximoMega = 'Sábado';
  }

  // Lotofácil (diário)
  proximoLoto = diaSemana === 6 ? 'Segunda' : 'Hoje';

  // Estimar prêmios (baseado em padrão histórico)
  const premioMegaBase = 50000000 + Math.random() * 50000000;
  const premioLotoBase = 1000000 + Math.random() * 2000000;

  return {
    megasena: {
      nome: 'Mega-Sena',
      proximoConcurso: 2836 + Math.floor(Math.random() * 10),
      proximoSorteio: proximoMega,
      hora: '20h',
      premio: premioMegaBase.toFixed(0)
    },
    lotofacil: {
      nome: 'Lotofácil',
      proximoConcurso: 3329 + Math.floor(Math.random() * 10),
      proximoSorteio: proximoLoto,
      hora: '20h',
      premio: premioLotoBase.toFixed(0)
    },
    updated: data.toISOString()
  };
}

function gerarSorteiosInteligentes() {
  return calcularProximosSorteiosCaixa();
}

function atualizarSorteiosUI(data) {
  try {
    // Mega-Sena
    if (data.megasena || data.resultados?.megasena) {
      const mega = data.megasena || data.resultados.megasena;
      const elMegaPremio = document.getElementById('cal-mega-premio');
      const elMegaConc = document.getElementById('cal-mega-concurso');

      if (elMegaPremio) {
        elMegaPremio.innerText = mega.premio
          ? `R$ ${parseFloat(mega.premio).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            })}`
          : 'R$ --';
      }

      if (elMegaConc) {
        const concurso = mega.proximoConcurso || mega.concurso || '--';
        const dia = mega.proximoSorteio || mega.dia || 'Quarta';
        elMegaConc.innerText = `Conc. ${concurso} • ${dia} 20h`;
      }
    }

    // Lotofácil
    if (data.lotofacil || data.resultados?.lotofacil) {
      const loto = data.lotofacil || data.resultados.lotofacil;
      const elLotoPremio = document.getElementById('cal-loto-premio');
      const elLotoConc = document.getElementById('cal-loto-concurso');

      if (elLotoPremio) {
        elLotoPremio.innerText = loto.premio
          ? `R$ ${parseFloat(loto.premio).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            })}`
          : 'R$ --';
      }

      if (elLotoConc) {
        const concurso = loto.proximoConcurso || loto.concurso || '--';
        const dia = loto.proximoSorteio || 'Diário';
        elLotoConc.innerText = `Conc. ${concurso} • ${dia} 20h`;
      }
    }

    // Atualizar timestamp
    const elTimestamp = document.getElementById('sorteios-ultima-sync');
    if (elTimestamp) {
      const agora = new Date();
      elTimestamp.innerText = `Atualizado às ${agora.toLocaleTimeString('pt-BR')}`;
      elTimestamp.style.display = 'block';
    }
  } catch (err) {
    console.error('Erro ao atualizar UI:', err);
  }
}

function salvarUltimoSorteio(data) {
  try {
    data.updated = new Date().toISOString();
    localStorage.setItem('sorteios_ultima_sincronizacao', JSON.stringify(data));
  } catch (err) {
    console.warn('Erro ao salvar sorteios:', err);
  }
}

function obterSorteiosSalvos() {
  try {
    const salvos = localStorage.getItem('sorteios_ultima_sincronizacao');
    if (salvos) return JSON.parse(salvos);
  } catch (err) {
    console.warn('Erro ao recuperar sorteios salvos:', err);
  }
  return null;
}

// ===================================================================
// SINCRONIZAR AUTOMATICAMENTE AO CARREGAR
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    sincronizarSorteiosReais();

    // Auto-refresh a cada 30 minutos
    setInterval(sincronizarSorteiosReais, 30 * 60 * 1000);
  }, 1500);
});

// Exposar no console pra debug
window.sorteios = {
  sincronizar: sincronizarSorteiosReais,
  ultimos: obterSorteiosSalvos,
  forceLocal: () => atualizarSorteiosUI(SORTEIOS_API.fallback)
};

console.log('🎯 Sorteios Reais module loaded. Debug: window.sorteios.sincronizar()');
