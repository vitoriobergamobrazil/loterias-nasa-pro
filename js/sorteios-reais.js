// ===================================================================
// SORTEIOS REAIS - Integração com API de Loterias
// ===================================================================
// Fonte: APIs públicas de loterias brasileiras
// Fallback: dados conhecidos da Caixa se API falhar

const SORTEIOS_API = {
  // API pública de loterias (via caixa-tracker ou similar)
  lotteriesApi: 'https://api.api-futebol.com.br/v1/loteria',

  // Dados fallback (últimos conhecidos) - atualizar periodicamente
  fallback: {
    megasena: {
      nome: 'Mega-Sena',
      proximoConcurso: 'Conc. 2836',
      proximoSorteio: 'Quarta',
      hora: '20h',
      premio: 'R$ 60.000.000',
      updated: new Date().toISOString()
    },
    lotofacil: {
      nome: 'Lotofácil',
      proximoConcurso: 'Conc. 3329',
      proximoSorteio: 'Hoje',
      hora: '20h',
      premio: 'R$ 1.500.000',
      updated: new Date().toISOString()
    }
  }
};

async function sincronizarSorteiosReais() {
  tocarBeep('click');
  const toast_id = toast('🔄 Buscando últimos sorteios da Caixa...', '📡');

  try {
    // Tentar API oficial
    const response = await fetch('https://api.caixa.gov.br/megasena', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      timeout: 5000
    });

    if (response.ok) {
      const data = await response.json();
      atualizarSorteiosUI(data);
      tocarSomNasa('sucesso');
      toast('✅ Sorteios atualizados com sucesso!', '🎯');
      salvarUltimoSorteio(data);
      return;
    }
  } catch (err) {
    console.warn('❌ API Caixa indisponível:', err.message);
  }

  try {
    // Fallback: tentar API alternativa (api-futebol)
    const response = await fetch('https://api.api-futebol.com.br/v1/loteria/megasena', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      atualizarSorteiosUI(data);
      tocarSomNasa('sucesso');
      toast('✅ Sorteios carregados!', '🎯');
      salvarUltimoSorteio(data);
      return;
    }
  } catch (err) {
    console.warn('❌ API alternativa indisponível:', err.message);
  }

  // Fallback: usar dados salvos ou hardcoded
  console.log('⚠️ APIs indisponíveis. Usando dados locais...');
  const sorteiosSalvos = obterSorteiosSalvos();
  if (sorteiosSalvos) {
    atualizarSorteiosUI(sorteiosSalvos);
    const dataAtualizacao = new Date(sorteiosSalvos.updated);
    const horaAgo = Math.floor((Date.now() - dataAtualizacao) / 1000 / 60);
    toast(
      `ℹ️ Usando últimos dados locais (${horaAgo}min atrás)`,
      '📌'
    );
  } else {
    atualizarSorteiosUI(SORTEIOS_API.fallback);
    toast('ℹ️ Usando dados padrão. Conecte à internet pra dados reais.', '📌');
  }
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
