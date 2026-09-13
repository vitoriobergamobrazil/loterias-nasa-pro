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
        '✓ 3 análises completas grátis ao cadastrar',
        '✓ 2 de 6 Testes Orbitais depois',
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
      cta: 'Assinar Mensal',
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

            ${plan.id === 'free' ? `
              <div class="modal-upgrade-trial-info">
                <span>🎁</span> Cadastre-se e ganhe 3 análises completas grátis.
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
    mostrarCheckoutReal('mensal');
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


// mostrarCheckoutComTrial(), confirmarPagamentoSimulado() e ativarTrialReal()
// concediam um trial de 3 dias, mecanismo próprio do plano Mensal. Removidas:
// o único "grátis" do app agora são as 3 análises por cadastro, sem prazo
// (js/creditos-gratis.js), a mesma oferta para qualquer caminho de entrada.
// processarUpgrade('mensal') vai direto para mostrarCheckoutReal('mensal')
// (js/checkout-asaas.js), como Avulso e Anual já faziam.

console.log('🎨 Upgrade modal module loaded');
