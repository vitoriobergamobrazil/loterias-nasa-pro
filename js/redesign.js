// ===================================================================
// REDESIGN NASA PRO - Bottom Tab Bar Logic & Navigation
// ===================================================================

// Tab configuration
const TABS_CONFIG = [
  { id: 'home', label: 'Início', icon: '🏠', view: 'view-inicio-new' },
  { id: 'gerar', label: 'Gerar', icon: '🎯', view: 'view-volante' },
  { id: 'analise', label: 'Análise', icon: '📊', view: 'view-calor' },
  { id: 'carteira', label: 'Carteira', icon: '💼', view: 'view-carteira' }
];

// Initialize redesign on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎨 Initializing NASA Pro redesign...');

  // Enable redesign class
  document.documentElement.classList.add('redesign');

  // Create bottom tab bar
  createBottomTabBar();

  // Create simplified home view
  createSimplifiedHome();

  // Set up event listeners
  setupTabNavigation();

  // Set default active tab
  activateTab('home');

  console.log('✅ Redesign initialized');
});

/**
 * Create bottom tab bar HTML
 */
function createBottomTabBar() {
  // Check if already exists
  if (document.getElementById('bottom-tab-bar')) return;

  const tabBar = document.createElement('div');
  tabBar.id = 'bottom-tab-bar';
  tabBar.className = 'bottom-tab-bar';

  TABS_CONFIG.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'bottom-tab-btn';
    btn.id = `tab-${tab.id}`;
    btn.onclick = () => activateTab(tab.id);
    btn.innerHTML = `
      <span>${tab.icon}</span>
      <span>${tab.label}</span>
    `;
    tabBar.appendChild(btn);
  });

  // Add to body at the end
  document.body.appendChild(tabBar);

  // Link to CSS
  if (!document.querySelector('link[href="./css/redesign.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './css/redesign.css';
    document.head.appendChild(link);
  }

  console.log('✅ Bottom tab bar created');
}

/**
 * Create simplified home view
 */
function createSimplifiedHome() {
  // Check if already exists
  if (document.getElementById('view-inicio-new')) return;

  // Create new home container
  const homeView = document.createElement('section');
  homeView.id = 'view-inicio-new';
  homeView.className = 'active';

  homeView.innerHTML = `
    <!-- Hero Card -->
    <div class="hero-simple">
      <h1>Monte seu próximo jogo</h1>
      <p>Organize suas dezenas e acompanhe bilhetes com análise estatística</p>
      <button class="hero-cta" onclick="activateTab('gerar'); tocarBeep('click');">
        🎯 Gerar um Jogo
      </button>
    </div>

    <!-- Próximos Sorteios -->
    <div class="info-card">
      <div class="info-card-title">📅 Próximos Sorteios</div>
      <div style="space-y: 0.5rem;">
        <div class="sorteio-card">
          <div class="sorteio-info">
            <div class="sorteio-modalidade">Mega-Sena</div>
            <div class="sorteio-tempo">Quarta 20h</div>
            <div class="sorteio-premio">Acumulado: R$ 56.5M</div>
          </div>
          <div class="sorteio-countdown">2h 45min</div>
        </div>

        <div class="sorteio-card">
          <div class="sorteio-info">
            <div class="sorteio-modalidade">Lotofácil</div>
            <div class="sorteio-tempo">Hoje 20h</div>
            <div class="sorteio-premio">Acumulado: R$ 1.85M</div>
          </div>
          <div class="sorteio-countdown">4h 20min</div>
        </div>
      </div>
    </div>

    <!-- Seu Progresso -->
    <div class="info-card">
      <div class="info-card-title">📊 Seu Progresso</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
        <div>
          <div class="info-card-value">0</div>
          <div class="info-card-subtitle">Bilhetes salvos</div>
        </div>
        <div>
          <div class="info-card-value">R$ 0</div>
          <div class="info-card-subtitle">Investimento</div>
        </div>
      </div>
    </div>

    <!-- Plano PRO -->
    <div class="info-card" style="border-color: rgb(245, 158, 11); background: rgba(245, 158, 11, 0.05);">
      <div class="info-card-title" style="color: rgb(245, 158, 11);">✨ Desbloqueie Recursos PRO</div>
      <p style="font-size: 0.875rem; color: rgb(203, 213, 225); margin: 0.75rem 0;">
        Gere palpites ilimitados, acesse matriz 4x4 completa e 6 testes estatísticos
      </p>
      <button onclick="abrirModalPaywall('home'); tocarBeep('click');"
              style="width: 100%; padding: 0.75rem; margin-top: 1rem; background: linear-gradient(135deg, rgb(245, 158, 11), rgb(217, 119, 6)); color: rgb(15, 23, 42); border: none; border-radius: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease;"
              onmouseover="this.style.transform='translateY(-2px)'"
              onmouseout="this.style.transform='translateY(0)'">
        Ver Planos (a partir de R$ 4,90)
      </button>
    </div>
  `;

  // Insert after main tag
  const main = document.querySelector('main');
  if (main) {
    main.insertBefore(homeView, main.firstChild);
  }

  console.log('✅ Simplified home view created');
}

/**
 * Activate a tab and show its view
 */
function activateTab(tabId) {
  // Update button states
  TABS_CONFIG.forEach(tab => {
    const btn = document.getElementById(`tab-${tab.id}`);
    if (btn) {
      btn.classList.toggle('active', tab.id === tabId);
    }
  });

  // Hide all views
  const allViews = document.querySelectorAll('main > section');
  allViews.forEach(view => {
    view.classList.remove('active');
    view.style.display = 'none';
  });

  // Show selected view
  const tabConfig = TABS_CONFIG.find(t => t.id === tabId);
  if (tabConfig) {
    // First try new simplified view
    if (tabConfig.id === 'home') {
      const homeView = document.getElementById('view-inicio-new');
      if (homeView) {
        homeView.classList.add('active');
        homeView.style.display = 'block';
        window.scrollTo(0, 0);
        return;
      }
    }

    // Otherwise use existing views
    const view = document.getElementById(tabConfig.view);
    if (view) {
      view.classList.add('active');
      view.style.display = 'block';
      window.scrollTo(0, 0);
      console.log(`✅ Activated tab: ${tabId}`);
    }
  }
}

/**
 * Setup tab navigation
 */
function setupTabNavigation() {
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key) {
        case '1':
          e.preventDefault();
          activateTab('home');
          break;
        case '2':
          e.preventDefault();
          activateTab('gerar');
          break;
        case '3':
          e.preventDefault();
          activateTab('analise');
          break;
        case '4':
          e.preventDefault();
          activateTab('carteira');
          break;
      }
    }
  });
}

/**
 * Get current active tab
 */
function getActiveTab() {
  return TABS_CONFIG.find(tab =>
    document.getElementById(`tab-${tab.id}`)?.classList.contains('active')
  )?.id || 'home';
}

/**
 * Navigate to a specific tab
 */
function navigateTo(tabId) {
  activateTab(tabId);
}

console.log('🎨 NASA Pro Redesign module loaded');
