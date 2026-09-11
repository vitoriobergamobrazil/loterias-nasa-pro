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
        '✓ 1 palpite por vez',
        '✓ 2 testes estatísticos',
        '✓ 2 bilhetes salvos',
        '✓ Básico'
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
        '✓ 3 palpites calibrados',
        '✓ 6 testes orbitais',
        '✓ Diagnóstico completo',
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
        '✓ Ilimitado',
        '✓ Matriz 4x4 completa',
        '✓ Fechamentos C(n,k)',
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
        <div class="modal-upgrade-badge">🚀 NASA Mission Control</div>
        <h2 class="modal-upgrade-title">Desbloqueie a Telemetria Completa</h2>
        <p class="modal-upgrade-subtitle">
          Escolha o plano perfeito para sua missão de apostas
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

/**
 * Show checkout for Avulso (R$ 4,90)
 */
function mostrarCheckoutAvulso() {
  tocarSomNasa('purchase');

  const modal = document.getElementById('modal-upgrade-nasa');
  const content = modal.querySelector('.modal-upgrade-content');

  content.innerHTML = `
    <button id="btn-close-upgrade-modal" class="modal-upgrade-close" title="Fechar">✕</button>

    <div class="modal-upgrade-checkout">
      <div class="modal-upgrade-checkout-header">
        <h3>Checkout - Quero Apenas 1 Jogo</h3>
        <p>R$ 4,90 • Pagamento único</p>
      </div>

      <div class="modal-upgrade-checkout-qrcode">
        <div class="modal-upgrade-qrcode-placeholder">
          [QR Code PIX]
          <br/>
          <small style="color: #94a3b8;">Simulado para teste</small>
        </div>
        <p style="text-align: center; font-size: 0.875rem; color: #cbd5e1; margin-top: 1rem;">
          Escaneie com seu app de banco
        </p>
      </div>

      <div class="modal-upgrade-checkout-copia-cola" style="margin: 1.5rem 0;">
        <p style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.5rem;">Ou copie e cola:</p>
        <div style="background: rgba(51, 65, 85, 0.8); border: 1px solid rgb(71, 85, 105); border-radius: 0.5rem; padding: 0.75rem; font-family: monospace; font-size: 0.75rem; word-break: break-all; color: #0ea5e9;">
          00020126580014br.gov.bcb.brcode01051.0.063084...
        </div>
        <button onclick="copiarCodigoPixParaClipboard()" style="width: 100%; margin-top: 0.75rem; padding: 0.75rem; background: rgb(34, 197, 94); color: white; border: none; border-radius: 0.5rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease;"
                onmouseover="this.style.transform='translateY(-2px)'"
                onmouseout="this.style.transform='translateY(0)'">
          📋 Copiar Código PIX
        </button>
      </div>

      <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgb(34, 211, 238); border-radius: 0.75rem; padding: 1rem; text-align: center;">
        <p style="font-size: 0.875rem; color: #0ea5e9; margin: 0;">
          ⏱️ Você tem <strong>10 minutos</strong> para confirmar o pagamento
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.5rem;">
        <button onclick="fecharModalUpgrade(); tocarBeep('click');"
                style="padding: 0.75rem; background: rgb(71, 85, 105); color: white; border: none; border-radius: 0.75rem; cursor: pointer;">
          Voltar
        </button>
        <button onclick="confirmarPagamentoSimulado('avulso'); tocarBeep('click');"
                style="padding: 0.75rem; background: linear-gradient(135deg, rgb(34, 197, 94), rgb(6, 182, 212)); color: rgb(15, 23, 42); border: none; border-radius: 0.75rem; font-weight: 700; cursor: pointer;">
          ✓ Confirmei o Pagamento
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-upgrade-modal')?.addEventListener('click', fecharModalUpgrade);
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
 * Show checkout for annual plan
 */
function mostrarCheckoutAnual() {
  tocarSomNasa('purchase');

  const modal = document.getElementById('modal-upgrade-nasa');
  const content = modal.querySelector('.modal-upgrade-content');

  content.innerHTML = `
    <button id="btn-close-upgrade-modal" class="modal-upgrade-close" title="Fechar">✕</button>

    <div class="modal-upgrade-checkout">
      <div class="modal-upgrade-checkout-header">
        <h3>Apollo VIP - Plano Anual</h3>
        <p>R$ 197/ano • R$ 16,41/mês (-45% desconto)</p>
      </div>

      <div class="modal-upgrade-checkout-qrcode">
        <div class="modal-upgrade-qrcode-placeholder">
          [QR Code PIX]
          <br/>
          <small style="color: #94a3b8;">Simulado para teste</small>
        </div>
        <p style="text-align: center; font-size: 0.875rem; color: #cbd5e1; margin-top: 1rem;">
          Escaneie com seu app de banco
        </p>
      </div>

      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgb(245, 158, 11); border-radius: 0.75rem; padding: 1rem; text-align: center; margin: 1.5rem 0;">
        <p style="font-size: 0.875rem; color: rgb(245, 158, 11); margin: 0;">
          💰 <strong>Economize R$ 161,80/ano</strong> comparado ao plano mensal
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.5rem;">
        <button onclick="fecharModalUpgrade(); tocarBeep('click');"
                style="padding: 0.75rem; background: rgb(71, 85, 105); color: white; border: none; border-radius: 0.75rem; cursor: pointer;">
          Voltar
        </button>
        <button onclick="confirmarPagamentoSimulado('anual'); tocarBeep('click');"
                style="padding: 0.75rem; background: linear-gradient(135deg, rgb(245, 158, 11), rgb(217, 119, 6)); color: rgb(15, 23, 42); border: none; border-radius: 0.75rem; font-weight: 700; cursor: pointer;">
          Assinar Agora
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-upgrade-modal')?.addEventListener('click', fecharModalUpgrade);
}

/**
 * Copy PIX code to clipboard
 */
function copiarCodigoPixParaClipboard() {
  const codigo = '00020126580014br.gov.bcb.brcode01051.0.063084...';
  navigator.clipboard.writeText(codigo).then(() => {
    toast('📋 Código PIX copiado!', '✅');
  });
}

/**
 * Simulated payment confirmation
 */
function confirmarPagamentoSimulado(planId) {
  tocarSomNasa('sucesso');

  // Simulate payment processing
  const modal = document.getElementById('modal-upgrade-nasa');
  const content = modal.querySelector('.modal-upgrade-content');

  content.innerHTML = `
    <div style="text-align: center; padding: 2rem; animation: slideIn 0.5s ease;">
      <div style="font-size: 3rem; margin-bottom: 1rem; animation: bounce 0.6s ease;">
        🎉
      </div>
      <h3 style="color: rgb(34, 197, 94); font-size: 1.5rem; font-weight: 900; margin: 0 0 0.5rem 0;">
        Conta Promovida!
      </h3>
      <p style="color: #cbd5e1; margin: 0 0 1.5rem 0;">
        Bem-vindo à NASA Pro. Sua missão começou.
      </p>
      <button onclick="fecharModalUpgrade(); toast('🚀 Novos recursos desbloqueados!', '✨'); tocarBeep('click');"
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

  // Update user plan in localStorage
  localStorage.setItem('plano_nasa_ativo', planId);
  console.log(`✅ Plan updated to: ${planId}`);
}

console.log('🎨 Upgrade modal module loaded');
