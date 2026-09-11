// ===================================================================
// SCIENCE GATE - Real enforcement of Free vs PRO limits + teaser lock
// ===================================================================
// Contexto: o app tinha um paywall "de fachada" - o seletor de
// quantidade bloqueava a UI, mas a função de geração nunca checava o
// plano de verdade, e os 6 Testes Orbitais apareciam 100% liberados
// pra todo mundo. Este arquivo fecha essas duas brechas sem tocar na
// lógica matemática existente (defesa em profundidade via wrapping).

const TESTES_BLOQUEADOS_FREE = [2, 3, 5, 6]; // Sequência (1) e Paridade (4) ficam livres

function usuarioEhPro() {
  if (typeof usuarioSessao !== 'undefined' && usuarioSessao && usuarioSessao.tipo === 'master_founder') return true;
  return typeof planoUsuario !== 'undefined' && planoUsuario === 'pro';
}

/**
 * Trava visual de um card de teste: borra o conteúdo e sobrepõe um
 * cadeado com CTA. Idempotente (não duplica a camada se já aplicada).
 */
function aplicarTravaCientifica(card, numeroTeste) {
  if (!card || card.querySelector('.science-lock-overlay')) return;
  card.classList.add('science-lock-blurred');

  const overlay = document.createElement('div');
  overlay.className = 'science-lock-overlay';
  overlay.innerHTML = `
    <span class="science-lock-icon">🔒</span>
    <span class="science-lock-label">Teste PRO</span>
  `;
  overlay.onclick = () => {
    if (typeof abrirModalPaywall === 'function') {
      abrirModalPaywall('bateria_testes');
    }
    if (typeof tocarBeep === 'function') tocarBeep('click');
  };
  card.appendChild(overlay);
}

function removerTravaCientifica(card) {
  if (!card) return;
  card.classList.remove('science-lock-blurred');
  const overlay = card.querySelector('.science-lock-overlay');
  if (overlay) overlay.remove();
}

/**
 * Aplica/remove a trava nos testes 2, 3, 5 e 6 e no painel de score
 * agregado, de acordo com o plano real do usuário.
 */
function aplicarGateCientificoNasa() {
  const pro = usuarioEhPro();

  TESTES_BLOQUEADOS_FREE.forEach(idx => {
    const card = document.getElementById(`teste-card-${idx}`);
    if (!card) return;
    if (pro) {
      removerTravaCientifica(card);
    } else {
      aplicarTravaCientifica(card, idx);
    }
  });

  // O score agregado é derivado dos 6 testes - mostrar o número
  // completo pra quem é FREE anularia o motivo de travar os 4 acima.
  const painelScore = document.getElementById('painel-score-telemetria');
  const badgeTotal = document.getElementById('badge-total-testes-ok');

  if (painelScore) {
    if (pro) {
      removerTravaCientifica(painelScore);
    } else if (!painelScore.querySelector('.science-lock-overlay')) {
      painelScore.classList.add('science-lock-blurred');
      const overlay = document.createElement('div');
      overlay.className = 'science-lock-overlay science-lock-overlay-panel';
      overlay.innerHTML = `
        <span class="science-lock-icon">🔬🔒</span>
        <span class="science-lock-label">Score completo é PRO</span>
        <span class="science-lock-sublabel">Veja o diagnóstico dos 6 testes e o score de eficiência combinatória</span>
      `;
      overlay.onclick = () => {
        if (typeof abrirModalPaywall === 'function') abrirModalPaywall('score_telemetria');
        if (typeof tocarBeep === 'function') tocarBeep('click');
      };
      painelScore.appendChild(overlay);
    }
  }

  if (badgeTotal && !pro) {
    badgeTotal.innerText = '2 de 6 visíveis';
  }
}

/**
 * Defesa em profundidade: mesmo que o seletor de quantidade tenha
 * sido burlado (ou o app tenha carregado com qtdApostasDesejada > 1
 * por padrão), a geração em si nunca deveria produzir mais de 1 jogo
 * pra quem não é PRO. Faz o wrap da função original em vez de
 * reescrevê-la, pra não arriscar quebrar a lógica combinatória.
 */
(function blindarGeracaoMultipla() {
  const tentarWrap = () => {
    if (typeof gerarMultiplasApostas !== 'function' || gerarMultiplasApostas.__scienceGated) {
      return typeof gerarMultiplasApostas === 'function';
    }

    const original = gerarMultiplasApostas;
    gerarMultiplasApostas = function (qtd, usarVitorio) {
      const qtdSolicitada = typeof qtd === 'number' ? qtd : (typeof qtdApostasDesejada !== 'undefined' ? qtdApostasDesejada : 1);
      if (!usuarioEhPro() && qtdSolicitada > 1) {
        if (typeof qtdApostasDesejada !== 'undefined') qtdApostasDesejada = 1;
        if (typeof abrirModalPaywall === 'function') abrirModalPaywall('multi_jogos');
        return original.call(this, 1, usarVitorio);
      }
      return original.call(this, qtd, usarVitorio);
    };
    gerarMultiplasApostas.__scienceGated = true;
    return true;
  };

  if (!tentarWrap()) {
    // Scripts carregam com defer; se ainda não existir, tenta de novo no DOMContentLoaded
    document.addEventListener('DOMContentLoaded', tentarWrap);
  }
})();

/**
 * Faz o wrap de atualizarVisualPlano (chamada sempre que a sessão ou
 * o plano mudam) pra manter a trava científica sincronizada em tempo
 * real, sem duplicar a lógica de carregamento de sessão existente.
 */
(function sincronizarGateComPlano() {
  const tentarWrap = () => {
    if (typeof atualizarVisualPlano !== 'function' || atualizarVisualPlano.__scienceGated) {
      return typeof atualizarVisualPlano === 'function';
    }
    const original = atualizarVisualPlano;
    atualizarVisualPlano = function (...args) {
      const resultado = original.apply(this, args);
      aplicarGateCientificoNasa();
      return resultado;
    };
    atualizarVisualPlano.__scienceGated = true;
    return true;
  };

  if (!tentarWrap()) {
    document.addEventListener('DOMContentLoaded', tentarWrap);
  }
})();

/**
 * Restaura ou expira o trial gratuito de 3 dias entre recarregamentos
 * de página. planoUsuario é uma variável em memória (reseta pra
 * 'free' a cada load), então sem isso o trial "sumiria" ao dar F5.
 */
function sincronizarTrialGratuito() {
  const expiraEmRaw = localStorage.getItem('nasa_trial_expira_em');
  if (!expiraEmRaw) return;

  const expiraEm = parseInt(expiraEmRaw, 10);
  if (Number.isNaN(expiraEm) || Date.now() >= expiraEm) {
    localStorage.removeItem('nasa_trial_expira_em');
    return;
  }

  // Trial ainda válido: restaura o plano PRO nesta sessão de página.
  if (typeof planoUsuario !== 'undefined' && planoUsuario !== 'pro') {
    planoUsuario = 'pro';
    if (typeof usuarioSessao !== 'undefined' && usuarioSessao) usuarioSessao.plano = 'pro';
    if (typeof atualizarVisualPlano === 'function') atualizarVisualPlano();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  sincronizarTrialGratuito();
  aplicarGateCientificoNasa();
  console.log('🔬 Science gate (paywall real) ativo');
});
