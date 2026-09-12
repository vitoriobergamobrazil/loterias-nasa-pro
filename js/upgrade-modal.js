// ===================================================================
// UPGRADE MODAL - Elegant Gradual Conversion (Free → Avulso → PRO)
// ===================================================================

const UPGRADE_CONFIG = {
  plans: [
    {
      id: 'free',
      name: 'Plano Gratuito',
      price: 'R$ 0',
      period: 'eternamente',
      features: [
        '✓ 1 análise por vez',
        '✓ 2 de 6 Testes Orbitais',
        '✓ Gestão de 2 bilhetes',
        '✓ Diagnóstico básico'
      ],
      cta: 'Seu plano atual',
      color: 'slate',
      badge: 'ATIVO'
    },
    {
      id: 'avulso',
      name: 'Quero Apenas 1 Jogo',
      price: 'R$ 4,90',
      period: 'único',
      features: [
        '✓ 3 apostas calibradas',
        '✓ Bateria completa dos 6 testes',
        '✓ Diagnóstico científico completo',
        '✓ Exportar WhatsApp'
      ],
      cta: 'Comprar Agora',
      color: 'emerald',
      badge: 'POPULAR',
      icon: '🎯'
    },
    {
      id: 'mensal',
      name: 'Astronauta NASA',
      price: 'R$ 29,90',
      period: '/mês',
      features: [
        '✓ Gestão de apostas ilimitada',
        '✓ Bateria completa dos 6 testes',
        '✓ Matriz 4x4 e fechamentos C(n,k)',
        '✓ Carteira em nuvem'
      ],
      cta: 'Testar 3 dias',
      color: 'cyan',
      badge: 'RECOMENDADO',
      icon: '🚀'
    },
    {
      id: 'anual',
      name: 'Apollo VIP',
      price: 'R$ 197',
      period: '/ano (R$ 16,41/mês)',
      features: [
        '✓ Tudo do mensal',
        '✓ -45% de desconto',
        '✓ Suporte VIP',
        '✓ Acesso antecipado'
      ],
      cta: 'Assinar Anual',
      color: 'amber',
      badge: 'MELHOR VALOR',
      icon: '👑'
    }
  ]
};

// Initialize upgrade modal on load
document.addEventListener('DOMContentLoaded', function() {
  createUpgradeModal();
  console.log('✅ Upgrade modal initialized');
});

/**
 * Create upgrade modal HTML
 */
function createUpgradeModal() {
  if (document.getElementById('modal-upgrade-nasa')) return;

  const modal = document.createElement('div');
  modal.id = 'modal-upgrade-nasa';
  modal.className = 'modal-upgrade-backdrop';
  modal.innerHTML = generateUpgradeModalHTML();

  document.body.appendChild(modal);

  // Event listeners
  document.getElementById('btn-close-upgrade-modal')?.addEventListener('click', fecharModalUpgrade);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) fecharModalUpgrade();
  });
}

/**
 * Generate upgrade modal HTML
 */
function generateUpgradeModalHTML() {
  return `
    <div class="modal-upgrade-content">
      <!-- Close Button -->
      <button id="btn-close-upgrade-modal" class="modal-upgrade-close" title="Fechar">✕</button>

      <!-- Header -->
      <div class="modal-upgrade-header">
        <div class="modal-upgrade-badge">🔬 Gestão com Ciência</div>
        <h2 class="modal-upgrade-title">Veja o Diagnóstico Completo</h2>
        <p class="modal-upgrade-subtitle">
          Desbloqueie a bateria completa dos 6 Testes Orbitais e gerencie suas apostas com todo o rigor estatístico da NASA
        </p>
      </div>

      <!-- Plans Grid -->
      <div class="modal-upgrade-plans">
        ${UPGRADE_CONFIG.plans.map((plan, idx) => `
          <div class="modal-upgrade-plan-card modal-upgrade-plan-${plan.color} ${idx === 2 ? 'modal-upgrade-plan-featured' : ''}">
            ${plan.badge ? `<div class="modal-upgrade-plan-badge">${plan.badge}</div>` : ''}

            <div class="modal-upgrade-plan-header">
              ${plan.icon ? `<span class="modal-upgrade-plan-icon">${plan.icon}</span>` : ''}
              <h3 class="modal-upgrade-plan-name">${plan.name}</h3>
            </div>

            <div class="modal-upgrade-plan-price">
              <span class="modal-upgrade-price-value">${plan.price}</span>
              <span class="modal-upgrade-price-period">${plan.period}</span>
            </div>

            <div class="modal-upgrade-plan-features">
              ${plan.features.map(f => `<div class="modal-upgrade-feature">${f}</div>`).join('')}
            </div>

            <button class="modal-upgrade-plan-cta modal-upgrade-cta-${plan.color}"
                    onclick="processarUpgrade('${plan.id}'); tocarBeep('click');">
              ${plan.cta}
            </button>

            ${plan.id === 'mensal' ? `
              <div class="modal-upgrade-trial-info">
                <span>⏱️</span> Teste grátis por 3 dias. Sem cartão necessário.
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <!-- Footer -->
      <div class="modal-upgrade-footer">
        <p class="modal-upgrade-terms">
          💳 Pagamentos seguros via PIX • Cancelar a qualquer momento
        </p>
        <button onclick="fecharModalUpgrade(); tocarBeep('click');" class="modal-upgrade-footer-close">
          Voltar
        </button>
      </div>
    </div>
  `;
}

/**
 * Open upgrade modal
 */
function abrirModalUpgrade(origin = 'home') {
  const modal = document.getElementById('modal-upgrade-nasa');
  if (modal) {
    modal.classList.add('modal-upgrade-active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    tocarBeep('whoosh');
    console.log(`📊 Upgrade modal opened from: ${origin}`);
  }
}

/**
 * Close upgrade modal
 */
function fecharModalUpgrade() {
  const modal = document.getElementById('modal-upgrade-nasa');
  if (modal) {
    modal.classList.remove('modal-upgrade-active');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    console.log('✅ Upgrade modal closed');
  }
}

/**
 * Process upgrade selection
 */
function processarUpgrade(planId) {
  const plan = UPGRADE_CONFIG.plans.find(p => p.id === planId);
  if (!plan) return;

  console.log(`🎯 Upgrade selected: ${planId}`);

  if (planId === 'free') {
    fecharModalUpgrade();
    toast('✅ Você já tem o plano gratuito', '🏠');
    return;
  }

  if (planId === 'avulso') {
    mostrarCheckoutAvulso();
  } else if (planId === 'mensal') {
    mostrarCheckoutComTrial();
  } else if (planId === 'anual') {
    mostrarCheckoutAnual();
  }
}

// Os checkouts abaixo mostravam "[QR Code PIX] Simulado para teste" com um
// código copia-e-cola inventado e um botão "Confirmei o Pagamento" que não
// verificava nada. Agora quem atende avulso e anual é mostrarCheckoutReal(),
// em js/checkout-asaas.js, que gera cobrança de verdade.
function mostrarCheckoutAvulso() {
  return mostrarCheckoutReal('avulso');
}

function mostrarCheckoutAnual() {
  return mostrarCheckoutReal('anual');
}


/**
 * Show checkout with 3-day trial
 */
function mostrarCheckoutComTrial() {
  tocarSomNasa('purchase');

  const modal = document.getElementById('modal-upgrade-nasa');
  const content = modal.querySelector('.modal-upgrade-content');

  content.innerHTML = `
    <button id="btn-close-upgrade-modal" class="modal-upgrade-close" title="Fechar">✕</button>

    <div class="modal-upgrade-checkout">
      <div class="modal-upgrade-checkout-header">
        <h3>Teste Gratuito - 3 Dias</h3>
        <p>Astronauta NASA • R$ 29,90/mês após teste</p>
      </div>

      <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgb(34, 197, 94); border-radius: 0.75rem; padding: 1rem; text-align: center; margin: 1.5rem 0;">
        <p style="font-size: 1.25rem; font-weight: 900; color: rgb(34, 197, 94); margin: 0;">
          3️⃣ DIAS GRÁTIS
        </p>
        <p style="font-size: 0.875rem; color: #cbd5e1; margin: 0.5rem 0 0 0;">
          Sem cartão necessário • Cancele a qualquer momento
        </p>
      </div>

      <div style="background: rgba(51, 65, 85, 0.5); border: 1px solid rgb(71, 85, 105); border-radius: 0.75rem; padding: 1rem; margin: 1rem 0;">
        <p style="font-size: 0.875rem; font-weight: 700; color: white; margin: 0 0 0.75rem 0;">✓ O que você terá acesso:</p>
        <ul style="font-size: 0.875rem; color: #cbd5e1; margin: 0; padding-left: 1.25rem;">
          <li>Palpites ilimitados</li>
          <li>Matriz 4x4 completa</li>
          <li>6 Testes Orbitais</li>
          <li>Carteira em nuvem</li>
          <li>Suporte prioritário</li>
        </ul>
      </div>

      <div style="display: flex; gap: 0.75rem; margin: 1.5rem 0; align-items: center; font-size: 0.875rem; color: #94a3b8;">
        <input type="email" id="input-trial-email" placeholder="seu@email.com" style="flex: 1; padding: 0.75rem; background: rgb(51, 65, 85); border: 1px solid rgb(71, 85, 105); border-radius: 0.5rem; color: white; outline: none;" />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <button onclick="fecharModalUpgrade(); tocarBeep('click');"
                style="padding: 0.75rem; background: rgb(71, 85, 105); color: white; border: none; border-radius: 0.75rem; cursor: pointer;">
          Voltar
        </button>
        <button onclick="confirmarPagamentoSimulado('mensal'); tocarBeep('click');"
                style="padding: 0.75rem; background: linear-gradient(135deg, rgb(34, 197, 94), rgb(6, 182, 212)); color: rgb(15, 23, 42); border: none; border-radius: 0.75rem; font-weight: 700; cursor: pointer;">
          Ativar Teste
        </button>
      </div>

      <p style="font-size: 0.75rem; color: #64748b; text-align: center; margin: 1rem 0 0 0;">
        Ao iniciar, você concorda com os Termos de Uso e Política de Privacidade
      </p>
    </div>
  `;

  document.getElementById('btn-close-upgrade-modal')?.addEventListener('click', fecharModalUpgrade);
}


/**
 * Confirmação pós-checkout.
 *
 * IMPORTANTE: nenhum gateway real está conectado ainda (Asaas/Mercado
 * Pago/BTG). Para os fluxos que envolvem dinheiro de verdade (Avulso
 * PIX e Anual), NUNCA finja sucesso — isso enganaria o usuário sobre
 * ter pago por algo que não foi cobrado. Só o Trial (que já é
 * anunciado como "sem cartão, grátis por 3 dias") pode conceder
 * acesso real, porque nenhum valor é cobrado nesse fluxo.
 */
function confirmarPagamentoSimulado(planId) {
  if (planId === 'mensal') {
    ativarTrialReal();
    return;
  }

  // Avulso e Anual dependem de gateway de pagamento real (PIX) que
  // ainda não está conectado. Mesma mensagem honesta que já existia
  // no restante do app (ver confirmarPagamentoPixSimulado em index.html).
  tocarBeep('alert');
  toast('🔒 Pagamento indisponível: este protótipo ainda não está conectado a um gateway real.', '⚠️');
}

/**
 * Concede um trial real de 3 dias (sem cartão, sem cobrança) e
 * sincroniza com o estado de plano que o resto do app já usa
 * (planoUsuario / usuarioSessao), disparando a atualização visual e
 * o gate científico dos 6 testes.
 */
function ativarTrialReal() {
  const expiraEm = Date.now() + (3 * 24 * 60 * 60 * 1000);
  localStorage.setItem('nasa_trial_expira_em', String(expiraEm));

  if (typeof planoUsuario !== 'undefined') planoUsuario = 'pro';
  if (typeof usuarioSessao !== 'undefined' && usuarioSessao) usuarioSessao.plano = 'pro';

  if (typeof atualizarVisualPlano === 'function') atualizarVisualPlano();
  if (typeof aplicarGateCientificoNasa === 'function') aplicarGateCientificoNasa();

  tocarSomNasa('sucesso');

  const modal = document.getElementById('modal-upgrade-nasa');
  const content = modal.querySelector('.modal-upgrade-content');

  const dataFim = new Date(expiraEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

  content.innerHTML = `
    <div style="text-align: center; padding: 2rem; animation: slideIn 0.5s ease;">
      <div style="font-size: 3rem; margin-bottom: 1rem; animation: bounce 0.6s ease;">
        🎉
      </div>
      <h3 style="color: rgb(34, 197, 94); font-size: 1.5rem; font-weight: 900; margin: 0 0 0.5rem 0;">
        Trial de 3 Dias Ativado!
      </h3>
      <p style="color: #cbd5e1; margin: 0 0 0.5rem 0;">
        Acesso completo liberado até <strong>${dataFim}</strong>. Sem cartão, sem cobrança automática.
      </p>
      <p style="color: #94a3b8; font-size: 0.75rem; margin: 0 0 1.5rem 0;">
        Ao final do teste, seu plano volta para o Gratuito automaticamente.
      </p>
      <button onclick="fecharModalUpgrade(); toast('🚀 Testes Orbitais completos liberados!', '✨'); tocarBeep('click');"
              style="padding: 0.75rem 2rem; background: linear-gradient(135deg, rgb(34, 197, 94), rgb(6, 182, 212)); color: rgb(15, 23, 42); border: none; border-radius: 0.75rem; font-weight: 700; cursor: pointer; font-size: 1rem;">
        Começar Agora
      </button>
    </div>

    <style>
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
    </style>
  `;

  console.log(`✅ Trial ativado até: ${new Date(expiraEm).toISOString()}`);
}

console.log('🎨 Upgrade modal module loaded');
