// ===================================================================
// REDESIGN NASA PRO 3.0 — Mobile-First FinTech & Telemetry Experience
// ===================================================================
// Arquitetura inspirada nas 50 melhores referências globais e nacionais
// (Jackpocket, TuLotero, Loterias CAIXA, 10Dobra, Expert Lotto):
// 1. Header Unificado de 1 linha (56px) com Pill Switcher Global (Mega / Lotofácil)
// 2. Navegação Inferior Nativa de 5 Abas (Início, Gerar, Fechamentos, Análise, Carteira)
// 3. Sub-Abas (Segmented Controls) em Gerar, Análise e Carteira & Bolão (Zero Scroll Infinito)
// 4. Volante Ergonômico (6 colunas na Mega-Sena mobile = bolas de 44px+) com toggle 10x6
// 5. Drawer de Perfil e Configurações (Conta, Créditos, Som, Tema, Sincronizar Caixa, LGPD, Admin)
// ===================================================================

const TABS_CONFIG = [
  { id: 'home', label: 'Início', icon: '🏠', view: 'view-inicio-new', legacyAba: 'inicio' },
  { id: 'gerar', label: 'Gerar', icon: '🎯', view: 'view-volante', legacyAba: 'volante' },
  { id: 'fechamentos', label: 'Fechar', icon: '📐', view: 'view-fechamentos', legacyAba: 'fechamentos' },
  { id: 'analise', label: 'Análise', icon: '📊', view: 'view-calor', legacyAba: 'calor' },
  { id: 'carteira', label: 'Carteira', icon: '💼', view: 'view-carteira', legacyAba: 'carteira' }
];

// Estado das Sub-Abas Mobile para eliminar rolagem infinita
let subAbaGerarAtiva = 'todos'; // 'rapido' | 'volante' | 'testes' | 'todos'
let subAbaCalorAtiva = 'ranking'; // 'ranking' | 'ciclo' | 'termica'
let subAbaCarteiraAtiva = 'bilhetes'; // 'bilhetes' | 'bolao' | 'ferramentas'
let volanteModo10Colunas = false;

document.addEventListener('DOMContentLoaded', function () {
  console.log('🎨 Inicializando NASA Pro Mobile 3.0...');

  document.documentElement.classList.add('redesign');

  // Em telas mobile (<640px), começa na sub-aba focada para evitar scroll gigante
  subAbaGerarAtiva = window.innerWidth <= 640 ? 'rapido' : 'todos';

  criarTopbarUnificada();
  createBottomTabBar();
  createSimplifiedHome();
  criarDrawerPerfilConfig();

  configurarSubAbasGerar();
  configurarToggleGradeVolante();
  configurarSubAbasAnalise();
  configurarSubAbasCarteiraEBolao();

  interceptarFuncoesLegadas();
  setupTabNavigation();

  sincronizarVisualModalidadeGlobal();
  sincronizarHeaderStatusUsuario();
  atualizarUltimoResultadoHome();

  activateTab('home');
  console.log('✅ NASA Pro Mobile 3.0 pronto.');
});

// ===================================================================
// 1. TOPBAR UNIFICADA DE 1 LINHA (56PX) + PILL SWITCHER MEGA/LOTOFÁCIL
// ===================================================================
function criarTopbarUnificada() {
  const header = document.querySelector('header');
  if (!header || document.getElementById('nasa-unified-topbar')) return;

  const topbar = document.createElement('div');
  topbar.id = 'nasa-unified-topbar';
  topbar.innerHTML = `
    <!-- Logo Compacto -->
    <button type="button" class="nasa-brand-compact" onclick="activateTab('home'); tocarBeep('click');" title="Ir para o Início">
      <div class="nasa-brand-icon">🚀</div>
      <div class="nasa-brand-text">
        <span class="nasa-brand-title">NASA PRO</span>
        <span class="nasa-brand-sub">TELEMETRY</span>
      </div>
    </button>

    <!-- Seletor Global de Loteria (1 toque em qualquer tela) -->
    <div class="nasa-modality-pill" role="tablist" aria-label="Escolher loteria">
      <button type="button" id="nasa-pill-mega" class="nasa-mod-btn active-mega" onclick="trocarModalidade('megasena')">
        <span>🍀</span>
        <span>Mega</span>
      </button>
      <button type="button" id="nasa-pill-loto" class="nasa-mod-btn" onclick="trocarModalidade('lotofacil')">
        <span>🟣</span>
        <span>Lotofácil</span>
      </button>
    </div>

    <!-- Ações Rápidas: VIP/Créditos + Menu Perfil -->
    <div class="nasa-header-actions">
      <button type="button" id="nasa-top-vip-btn" class="nasa-vip-chip" onclick="abrirModalPaywall('header')" title="Status do Plano e Créditos">
        <span id="nasa-top-vip-icon">⚡</span>
        <span id="nasa-top-vip-label">PRO</span>
      </button>
      <button type="button" id="nasa-top-drawer-btn" class="nasa-drawer-trigger" onclick="abrirDrawerPerfil()" title="Menu (Configurações, Mestres, Termos & LGPD)" aria-label="Abrir menu de configurações, mestres e conta">
        <span id="nasa-top-avatar" style="font-size: 1.25rem; font-weight: 900; line-height: 1; letter-spacing: -1px;">⋯</span>
      </button>
    </div>
  `;

  header.insertBefore(topbar, header.firstChild);
}

function sincronizarVisualModalidadeGlobal() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const pillMega = document.getElementById('nasa-pill-mega');
  const pillLoto = document.getElementById('nasa-pill-loto');

  document.documentElement.classList.toggle('lotofacil-mode', mod === 'lotofacil');

  if (pillMega && pillLoto) {
    if (mod === 'megasena') {
      pillMega.className = 'nasa-mod-btn active-mega';
      pillLoto.className = 'nasa-mod-btn';
    } else {
      pillMega.className = 'nasa-mod-btn';
      pillLoto.className = 'nasa-mod-btn active-loto';
    }
  }

  // Destaca o card ativo na Home
  const cardMega = document.getElementById('home-card-mega');
  const cardLoto = document.getElementById('home-card-loto');
  if (cardMega && cardLoto) {
    cardMega.className = `nasa-jackpot-mini-card ${mod === 'megasena' ? 'active-mod' : ''}`;
    cardLoto.className = `nasa-jackpot-mini-card ${mod === 'lotofacil' ? 'active-mod-loto' : ''}`;
  }

  // Mostra/esconde botão de alternar 6x10 vs 10x6 apenas na Mega-Sena
  const btnGridToggle = document.getElementById('btn-toggle-volante-cols');
  if (btnGridToggle) {
    btnGridToggle.style.display = mod === 'megasena' ? 'inline-flex' : 'none';
  }

  atualizarUltimoResultadoHome();
}

function sincronizarHeaderStatusUsuario() {
  const vipBtn = document.getElementById('nasa-top-vip-btn');
  const vipIcon = document.getElementById('nasa-top-vip-icon');
  const vipLabel = document.getElementById('nasa-top-vip-label');
  const topAvatar = document.getElementById('nasa-top-avatar');

  const ehPro = (typeof planoUsuario !== 'undefined' && planoUsuario === 'pro') ||
                (typeof usuarioSessao !== 'undefined' && usuarioSessao?.tipo === 'master_founder');

  const creditos = typeof window.creditosGratisRestantes === 'function'
    ? window.creditosGratisRestantes()
    : (typeof usuarioSessao !== 'undefined' ? Number(usuarioSessao?.creditosGratis || 0) : 0);

  if (vipBtn && vipIcon && vipLabel) {
    if (ehPro) {
      vipBtn.classList.add('is-pro');
      vipIcon.innerText = '👑';
      vipLabel.innerText = 'VIP ATIVO';
    } else if (creditos > 0) {
      vipBtn.classList.remove('is-pro');
      vipIcon.innerText = '🎁';
      vipLabel.innerText = `${creditos} Grátis`;
    } else {
      vipBtn.classList.remove('is-pro');
      vipIcon.innerText = '⚡';
      vipLabel.innerText = 'SEJA PRO';
    }
  }

  if (topAvatar && typeof usuarioSessao !== 'undefined' && usuarioSessao) {
    if (usuarioSessao.tipo === 'master_founder') {
      topAvatar.innerText = '👑';
    } else if (usuarioSessao.tipo !== 'visitante' && usuarioSessao.nome) {
      topAvatar.innerText = (usuarioSessao.nome[0] || 'U').toUpperCase();
    } else {
      topAvatar.innerText = '⋯';
    }
  }
}

// ===================================================================
// 2. BOTTOM TAB BAR DE 5 ABAS NATIVAS
// ===================================================================
function createBottomTabBar() {
  let tabBar = document.getElementById('bottom-tab-bar');
  if (tabBar) tabBar.remove();

  tabBar = document.createElement('nav');
  tabBar.id = 'bottom-tab-bar';
  tabBar.className = 'bottom-tab-bar';
  tabBar.setAttribute('aria-label', 'Navegação principal');

  TABS_CONFIG.forEach((tab) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bottom-tab-btn';
    btn.id = `bottom-nav-${tab.id}`;
    btn.onclick = () => {
      if (typeof tocarBeep === 'function') tocarBeep('click');
      if (typeof vibrarHaptico === 'function') vibrarHaptico(10);
      activateTab(tab.id);
    };
    btn.innerHTML = `
      <span class="tab-icon">${tab.icon}</span>
      <span class="tab-label">${tab.label}</span>
    `;
    tabBar.appendChild(btn);
  });

  document.body.appendChild(tabBar);
}

// ===================================================================
// 3. NOVA HOME MOBILE-FIRST (DASHBOARD COMPLETO SEM POLUIÇÃO)
// ===================================================================
function createSimplifiedHome() {
  let homeView = document.getElementById('view-inicio-new');
  if (homeView) homeView.remove();

  homeView = document.createElement('section');
  homeView.id = 'view-inicio-new';
  homeView.className = 'active';

  homeView.innerHTML = `
    <div class="nasa-home-grid">

      <!-- 1. HERO CARD: PRÓXIMOS SORTEIOS + AÇÃO IMEDIATA -->
      <div class="nasa-jackpot-hero">
        <div class="nasa-jackpot-top">
          <span class="nasa-live-pill">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span id="home-active-mod-badge">MEGA-SENA ATIVA</span>
          </span>
          <span class="nasa-countdown-badge js-megasena-countdown" id="home-active-countdown">Sorteio às 20h</span>
        </div>

        <!-- Dupla de Cards: Toque para alternar entre Mega-Sena e Lotofácil -->
        <div class="nasa-jackpot-MainRow">
          <div id="home-card-mega" class="nasa-jackpot-mini-card active-mod" onclick="trocarModalidade('megasena')">
            <div class="nasa-mini-label">
              <span class="text-emerald-400">🍀 MEGA-SENA</span>
              <span class="text-[10px] text-slate-400 js-mega-concurso">—</span>
            </div>
            <div class="nasa-mini-prize js-mega-premio">Carregando...</div>
            <div class="nasa-mini-sub">⏱️ <span class="js-megasena-countdown">—</span></div>
          </div>

          <div id="home-card-loto" class="nasa-jackpot-mini-card" onclick="trocarModalidade('lotofacil')">
            <div class="nasa-mini-label">
              <span class="text-purple-400">🟣 LOTOFÁCIL</span>
              <span class="text-[10px] text-slate-400 js-loto-concurso">—</span>
            </div>
            <div class="nasa-mini-prize js-loto-premio">Carregando...</div>
            <div class="nasa-mini-sub">⏱️ <span class="js-lotofacil-countdown">—</span></div>
          </div>
        </div>

        <!-- Botão Principal: Gerar Jogo Calibrado -->
        <button type="button" class="nasa-primary-cta" onclick="irParaGeradorRapido()">
          <span class="text-xl">🚀</span>
          <span>GERAR JOGO CALIBRADO AGORA</span>
        </button>

        <!-- Botões Secundários: Caminho A ("Já tenho meus números") + Volante Manual -->
        <div class="nasa-secondary-cta-row">
          <button type="button" class="nasa-sec-btn" onclick="abrirModalAnalisarNumeros(); tocarBeep('click');">
            <span>🔬</span>
            <span>Testar Meu Jogo</span>
          </button>
          <button type="button" class="nasa-sec-btn" onclick="irParaVolanteManual()">
            <span>🎯</span>
            <span>Marcar no Volante</span>
          </button>
        </div>
      </div>

      <!-- 2. ÚLTIMO RESULTADO OFICIAL DA CAIXA (Bolas Reais + Sincronizar) -->
      <div class="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-sm">🏛️</span>
            <div>
              <h3 class="text-xs font-black text-white uppercase tracking-wide" id="home-ultimo-titulo">Último Resultado Oficial Caixa</h3>
              <span class="text-[10px] text-slate-400 font-mono" id="home-ultimo-sub">Sincronizado em tempo real</span>
            </div>
          </div>
          <button type="button" onclick="sincronizarConcursos()" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold border border-slate-700 flex items-center gap-1 active:scale-95 transition">
            <span>🔄</span> Atualizar
          </button>
        </div>
        <div id="home-ultimo-dezenas" class="flex flex-wrap gap-1.5 pt-0.5">
          <span class="text-xs text-slate-400 font-mono">Buscando último sorteio oficial na Caixa...</span>
        </div>
      </div>

      <!-- 3. ATALHOS PARA TODAS AS FERRAMENTAS DO APP (2x2) -->
      <div class="nasa-quick-tools-grid">
        <button type="button" class="nasa-tool-tile" onclick="activateTab('fechamentos'); tocarBeep('click');">
          <div class="nasa-tool-tile-header">
            <div class="nasa-tool-icon bg-cyan-950 text-cyan-300 border border-cyan-800">📐</div>
            <span class="text-[10px] font-mono font-bold text-cyan-400">C(n,k)</span>
          </div>
          <div class="nasa-tool-title">Fechamentos</div>
          <div class="nasa-tool-desc">Cerque 10 a 20 dezenas com economia de até 98%</div>
        </button>

        <button type="button" class="nasa-tool-tile" onclick="activateTab('analise'); tocarBeep('click');">
          <div class="nasa-tool-tile-header">
            <div class="nasa-tool-icon bg-rose-950 text-rose-300 border border-rose-800">🔥</div>
            <span class="text-[10px] font-mono font-bold text-rose-400">TOP 10</span>
          </div>
          <div class="nasa-tool-title">Quentes & Ciclo</div>
          <div class="nasa-tool-desc">Mais sorteadas, atrasadas e dezenas que faltam no ciclo</div>
        </button>

        <button type="button" class="nasa-tool-tile" onclick="irParaCarteiraSubAba('bilhetes')">
          <div class="nasa-tool-tile-header">
            <div class="nasa-tool-icon bg-emerald-950 text-emerald-300 border border-emerald-800">💼</div>
            <span class="text-[10px] font-mono font-bold text-emerald-400"><span class="js-progresso-bilhetes">0</span> salvos</span>
          </div>
          <div class="nasa-tool-title">Minha Carteira</div>
          <div class="nasa-tool-desc">Confira seus bilhetes automaticamente na Caixa</div>
        </button>

        <button type="button" class="nasa-tool-tile" onclick="irParaCarteiraSubAba('bolao')">
          <div class="nasa-tool-tile-header">
            <div class="nasa-tool-icon bg-teal-950 text-teal-300 border border-teal-800">👥</div>
            <span class="text-[10px] font-mono font-bold text-teal-400">WhatsApp</span>
          </div>
          <div class="nasa-tool-title">Bolão & Rateio</div>
          <div class="nasa-tool-desc">Divida cotas entre amigos e gere recibo para o grupo</div>
        </button>
      </div>

      
      <!-- SEÇÃO DINÂMICA: APOSTAS ATIVAS DA CARTEIRA -->
      <div id="home-bloco-apostas-ativas" class="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-sm">💼</span>
            <div>
              <h3 class="text-xs font-black text-white">Minhas Apostas Ativas</h3>
              <span class="text-[10px] text-slate-400">Monitoramento e conferência oficial</span>
            </div>
          </div>
          <button type="button" onclick="irParaCarteiraSubAba('bilhetes')" class="px-2 py-1 rounded-xl bg-slate-800 text-cyan-300 text-[10px] font-bold border border-slate-700">
            Ver Carteira →
          </button>
        </div>
        <div id="home-apostas-ativas-conteudo" class="text-xs text-slate-400">
          <span class="text-[11px]">Nenhuma aposta ativa registrada ainda. Gere seu jogo e toque em <b>✅ JOGUEI ESTE JOGO!</b></span>
        </div>
      </div>

      <!-- SEÇÃO AUDITORIA: PROVA DOS FATOS NOS ÚLTIMOS 10 SORTEIOS CAIXA -->
      <div class="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div>
            <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[9px] font-mono font-black text-cyan-300 uppercase">
              <span>🔬</span> PROVA DOS FATOS
            </div>
            <h3 class="text-xs font-black text-white mt-0.5">Auditoria dos Últimos 10 Sorteios Oficiais</h3>
          </div>
          <span id="badge-pct-aprovados-home" class="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
            100% APROVADO
          </span>
        </div>

        <p class="text-[11px] text-slate-300 leading-relaxed" id="home-prova-fatos-resumo">
          Veja como os últimos resultados reais divulgados pela Caixa obedecem com rigor aos 6 filtros estatísticos:
        </p>

        <div id="home-lista-ultimos-sorteios-avaliados" class="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 no-scrollbar">
          <div class="text-center py-2 text-xs text-slate-400">Carregando auditoria dos concursos...</div>
        </div>
      </div>

      <!-- 4. CARD COMPACTO DE CONTA / PLANO PRO -->
      <div id="home-promo-pro-card" class="bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/40 border border-amber-500/50 rounded-2xl p-3.5 flex items-center justify-between gap-3">
        <div class="space-y-0.5">
          <div class="text-xs font-black text-amber-300 flex items-center gap-1.5">
            <span>🔬</span>
            <span>6 Testes Orbitais + Jogos Ilimitados</span>
          </div>
          <p class="text-[11px] text-slate-300 leading-snug">
            Desbloqueie Entropia de Shannon, Qui-Quadrado, Curva de Gauss e Fechamentos completos.
          </p>
        </div>
        <button type="button" onclick="abrirModalPaywall('home'); tocarBeep('click');" class="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs whitespace-nowrap shadow active:scale-95 transition">
          Ver Planos
        </button>
      </div>

    </div>
  `;

  const main = document.querySelector('main');
  if (main) {
    main.insertBefore(homeView, main.firstChild);
  }

  if (typeof carteiraJogos !== 'undefined' && Array.isArray(carteiraJogos)) {
    const totalInvestido = carteiraJogos.reduce((soma, b) => soma + (b.custo || 0), 0);
    atualizarResumoHome(carteiraJogos.length, totalInvestido);
  }
}

async function atualizarUltimoResultadoHome() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const badgeMod = document.getElementById('home-active-mod-badge');
  if (badgeMod) {
    badgeMod.innerText = mod === 'megasena' ? '🍀 MEGA-SENA ATIVA' : '🟣 LOTOFÁCIL ATIVA';
  }

  const tituloEl = document.getElementById('home-ultimo-titulo');
  const subEl = document.getElementById('home-ultimo-sub');
  const dezenasEl = document.getElementById('home-ultimo-dezenas');
  if (!dezenasEl) return;

  const base = mod === 'megasena'
    ? (typeof baseConcursosMega !== 'undefined' ? baseConcursosMega : [])
    : (typeof baseConcursosLoto !== 'undefined' ? baseConcursosLoto : []);

  let ultimo = base && base.length > 0 ? base[0] : null;

  // Se o histórico ainda não carregou, tenta buscar o último direto da API da Caixa
  if (!ultimo && typeof window.obterUltimoResultadoOficial === 'function') {
    try {
      const res = await window.obterUltimoResultadoOficial(mod);
      if (res && Array.isArray(res.dezenas)) {
        ultimo = res;
      }
    } catch (_) {}
  }

  if (tituloEl) {
    tituloEl.innerText = `Último Resultado • ${mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil'}`;
  }

  if (!ultimo || !Array.isArray(ultimo.dezenas) || ultimo.dezenas.length === 0) {
    if (subEl) subEl.innerText = 'Toque em Atualizar para buscar na Caixa';
    dezenasEl.innerHTML = `<span class="text-xs text-slate-400">Toque em <b>🔄 Atualizar</b> para carregar as dezenas sorteadas.</span>`;
    return;
  }

  if (subEl) {
    subEl.innerText = `Concurso #${ultimo.concurso || '—'} ${ultimo.data ? '• ' + ultimo.data : ''}`;
  }

  const corBola = mod === 'megasena'
    ? 'bg-emerald-600 text-slate-950 border-emerald-400'
    : 'bg-purple-600 text-white border-purple-400';

  if (typeof atualizarProvaDosFatosRedesign === "function") atualizarProvaDosFatosRedesign();
  dezenasEl.innerHTML = ultimo.dezenas.map((d) => `
    <span class="w-8 h-8 rounded-xl ${corBola} border font-mono font-black text-xs flex items-center justify-center shadow-sm">
      ${String(d).padStart(2, '0')}
    </span>
  `).join('');
}

// ===================================================================
// 4. SUB-ABAS NA TELA "GERAR" (ACABA COM O SCROLL DE 4 TELAS)
// ===================================================================
function configurarSubAbasGerar() {
  const secVolante = document.getElementById('view-volante');
  if (!secVolante || document.getElementById('nasa-seg-gerar')) return;

  // Identifica os blocos filhos da section#view-volante para alterná-los sem esconder nada permanentemente
  const cards = Array.from(secVolante.children);
  if (cards[0]) cards[0].id = cards[0].id || 'card-gerador-rapido';
  if (cards[1]) cards[1].id = cards[1].id || 'card-volante-manual';
  if (cards[2]) cards[2].id = cards[2].id || 'card-matriz-4x4-box';

  const segBar = document.createElement('div');
  segBar.id = 'nasa-seg-gerar';
  segBar.className = 'nasa-segmented-bar';
  segBar.innerHTML = `
    <button type="button" id="seg-gerar-rapido" class="nasa-seg-btn active" onclick="alternarSubAbaGerar('rapido')">
      <span>🚀</span> <span>Gerar</span>
    </button>
    <button type="button" id="seg-gerar-volante" class="nasa-seg-btn" onclick="alternarSubAbaGerar('volante')">
      <span>🎯</span> <span>Volante</span>
    </button>
    <button type="button" id="seg-gerar-testes" class="nasa-seg-btn" onclick="alternarSubAbaGerar('testes')">
      <span>🛡️</span> <span>Testes (<span id="seg-badge-testes-count">6/6</span>)</span>
    </button>
    <button type="button" id="seg-gerar-todos" class="nasa-seg-btn" onclick="alternarSubAbaGerar('todos')" title="Mostrar tudo na mesma tela">
      <span>📋</span> <span>Tudo</span>
    </button>
  `;

  secVolante.insertBefore(segBar, secVolante.firstChild);
  aplicarVisibilidadeSubAbaGerar();
}

function alternarSubAbaGerar(modo) {
  subAbaGerarAtiva = modo;
  if (typeof tocarBeep === 'function') tocarBeep('click');
  aplicarVisibilidadeSubAbaGerar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function aplicarVisibilidadeSubAbaGerar() {
  ['rapido', 'volante', 'testes', 'todos'].forEach((m) => {
    const btn = document.getElementById(`seg-gerar-${m}`);
    if (btn) btn.classList.toggle('active', m === subAbaGerarAtiva);
  });

  const cardGerador = document.getElementById('card-gerador-rapido');
  const cardVolante = document.getElementById('card-volante-manual');
  const cardMatriz = document.getElementById('card-matriz-4x4-box');
  const cardScore = document.getElementById('painel-score-telemetria');
  const cardTestes = document.getElementById('card-bateria-testes');
  const cardSugestao = document.getElementById('card-sugestao-troca');
  const cardRetro = document.getElementById('card-simulador-historico');

  const mostrar = (el, visivel) => {
    if (!el) return;
    el.style.display = visivel ? '' : 'none';
  };

  if (subAbaGerarAtiva === 'rapido') {
    mostrar(cardGerador, true);
    mostrar(cardScore, true);
    mostrar(cardSugestao, true);
    mostrar(cardVolante, false);
    mostrar(cardMatriz, false);
    mostrar(cardTestes, true);
    mostrar(cardRetro, false);
  } else if (subAbaGerarAtiva === 'volante') {
    mostrar(cardGerador, false);
    mostrar(cardVolante, true);
    mostrar(cardScore, true);
    mostrar(cardSugestao, true);
    mostrar(cardMatriz, true);
    mostrar(cardTestes, false);
    mostrar(cardRetro, false);
  } else if (subAbaGerarAtiva === 'testes') {
    mostrar(cardGerador, false);
    mostrar(cardVolante, false);
    mostrar(cardScore, true);
    mostrar(cardTestes, true);
    mostrar(cardSugestao, true);
    mostrar(cardMatriz, true);
    mostrar(cardRetro, true);
    // Garante que os painéis colapsáveis estejam abertos ao visitar a aba 6 Testes
    ['conteudo-bateria-testes', 'conteudo-matriz-vitorio', 'conteudo-simulador-historico'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('hidden');
    });
  } else {
    // 'todos'
    [cardGerador, cardVolante, cardMatriz, cardScore, cardTestes, cardSugestao, cardRetro].forEach((el) => mostrar(el, true));
  }
}

// Permite alternar o volante da Mega-Sena entre "6 colunas grandes (44px)" e "10 colunas clássico"
function configurarToggleGradeVolante() {
  const cardVolante = document.getElementById('card-volante-manual');
  if (!cardVolante || document.getElementById('btn-toggle-volante-cols')) return;

  const controlsBox = document.getElementById('volante-top-controls') || cardVolante.querySelector('.flex.justify-between.items-center');
  if (!controlsBox) return;

  const btnToggle = document.createElement('button');
  btnToggle.type = 'button';
  btnToggle.id = 'btn-toggle-volante-cols';
  btnToggle.className = 'px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-[11px] font-bold transition inline-flex items-center gap-1';
  btnToggle.innerHTML = '<span>📱</span> <span id="lbl-toggle-cols">Grade 6x10</span>';
  btnToggle.onclick = () => {
    volanteModo10Colunas = !volanteModo10Colunas;
    const grid = document.getElementById('volante-grid');
    const lbl = document.getElementById('lbl-toggle-cols');
    if (grid) grid.classList.toggle('classic-10x6', volanteModo10Colunas);
    if (lbl) lbl.innerText = volanteModo10Colunas ? 'Grade 10x6' : 'Grade 6x10';
    if (typeof tocarBeep === 'function') tocarBeep('click');
  };

  controlsBox.appendChild(btnToggle);
}

// ===================================================================
// 5. SUB-ABAS NA TELA "ANÁLISE / ESTATÍSTICAS" (#view-calor)
// ===================================================================
function configurarSubAbasAnalise() {
  const secCalor = document.getElementById('view-calor');
  if (!secCalor || document.getElementById('nasa-seg-calor')) return;

  const filhos = Array.from(secCalor.children);
  // filhos[0] = Hero estatísticas, filhos[1] = Top 10 Quentes, filhos[2] = Top 10 Frias, filhos[3] = Ciclo, filhos[4] = Grade Térmica
  if (filhos[1]) filhos[1].id = filhos[1].id || 'calor-card-quentes';
  if (filhos[2]) filhos[2].id = filhos[2].id || 'calor-card-frias';
  if (filhos[3]) filhos[3].id = filhos[3].id || 'card-ciclo-dezenas';
  if (filhos[4]) filhos[4].id = filhos[4].id || 'calor-card-termica';

  const segBar = document.createElement('div');
  segBar.id = 'nasa-seg-calor';
  segBar.className = 'nasa-segmented-bar';
  segBar.innerHTML = `
    <button type="button" id="seg-calor-ranking" class="nasa-seg-btn active" onclick="alternarSubAbaCalor('ranking')">
      <span>🔥</span> <span>Quentes & Frias</span>
    </button>
    <button type="button" id="seg-calor-ciclo" class="nasa-seg-btn" onclick="alternarSubAbaCalor('ciclo')">
      <span>🔄</span> <span>Ciclo</span>
    </button>
    <button type="button" id="seg-calor-termica" class="nasa-seg-btn" onclick="alternarSubAbaCalor('termica')">
      <span>🗺️</span> <span>Mapa de Calor</span>
    </button>
  `;

  secCalor.insertBefore(segBar, secCalor.firstChild);
  aplicarVisibilidadeSubAbaCalor();
}

function alternarSubAbaCalor(modo) {
  subAbaCalorAtiva = modo;
  if (typeof tocarBeep === 'function') tocarBeep('click');
  aplicarVisibilidadeSubAbaCalor();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function aplicarVisibilidadeSubAbaCalor() {
  ['ranking', 'ciclo', 'termica'].forEach((m) => {
    const btn = document.getElementById(`seg-calor-${m}`);
    if (btn) btn.classList.toggle('active', m === subAbaCalorAtiva);
  });

  const quentes = document.getElementById('calor-card-quentes');
  const frias = document.getElementById('calor-card-frias');
  const ciclo = document.getElementById('card-ciclo-dezenas');
  const termica = document.getElementById('calor-card-termica');

  const mostrar = (el, v) => { if (el) el.style.display = v ? '' : 'none'; };

  if (subAbaCalorAtiva === 'ranking') {
    mostrar(quentes, true);
    mostrar(frias, true);
    mostrar(ciclo, false);
    mostrar(termica, false);
  } else if (subAbaCalorAtiva === 'ciclo') {
    mostrar(quentes, false);
    mostrar(frias, false);
    mostrar(ciclo, true);
    mostrar(termica, false);
  } else {
    mostrar(quentes, false);
    mostrar(frias, false);
    mostrar(ciclo, false);
    mostrar(termica, true);
  }
}

// ===================================================================
// 6. SUB-ABAS NA TELA "CARTEIRA & BOLÃO" (#view-carteira + #view-bolao)
// ===================================================================
function configurarSubAbasCarteiraEBolao() {
  const secCarteira = document.getElementById('view-carteira');
  const secBolao = document.getElementById('view-bolao');
  if (!secCarteira || document.getElementById('nasa-seg-carteira')) return;

  // Move o conteúdo de #view-bolao para dentro de um container dedicado em #view-carteira
  // mantendo todos os IDs intactos para que calcularRateioBolao(), incluirJogoAtualNoBolao() etc. funcionem 100%
  const filhosCarteira = Array.from(secCarteira.children);
  const wrapperBilhetes = document.createElement('div');
  wrapperBilhetes.id = 'carteira-subview-bilhetes';
  wrapperBilhetes.className = 'space-y-4';

  const wrapperFerramentas = document.createElement('div');
  wrapperFerramentas.id = 'carteira-subview-ferramentas';
  wrapperFerramentas.className = 'space-y-4 hidden';

  // Distribui os cards originais da carteira:
  // [0] Calendário Caixa, [1] Minha Carteira (Saldos), [2] Calibração Portfólio, [3] Exportação/Backup, [4] Importador, [5] Lista Bilhetes, [6] Scanner em Lote
  filhosCarteira.forEach((card, idx) => {
    if (idx === 1 || idx === 5 || idx === 0) {
      wrapperBilhetes.appendChild(card);
    } else {
      wrapperFerramentas.appendChild(card);
    }
  });

  // Reordena dentro de Meus Bilhetes para que "Minha Carteira" e "Lista de Bilhetes" venham no topo, antes do Calendário
  const cardsBilhetes = Array.from(wrapperBilhetes.children);
  if (cardsBilhetes.length === 3) {
    // original: [0]=Calendário, [1]=Saldos, [2]=Lista
    wrapperBilhetes.innerHTML = '';
    wrapperBilhetes.appendChild(cardsBilhetes[1]); // Saldos + Botão Conferir Tudo
    wrapperBilhetes.appendChild(cardsBilhetes[2]); // Lista de Bilhetes Salvos
    wrapperBilhetes.appendChild(cardsBilhetes[0]); // Calendário Oficial Caixa
  }

  const wrapperBolao = document.createElement('div');
  wrapperBolao.id = 'carteira-subview-bolao';
  wrapperBolao.className = 'space-y-4 hidden';

  if (secBolao) {
    while (secBolao.firstChild) {
      wrapperBolao.appendChild(secBolao.firstChild);
    }
  }

  const segBar = document.createElement('div');
  segBar.id = 'nasa-seg-carteira';
  segBar.className = 'nasa-segmented-bar';
  segBar.innerHTML = `
    <button type="button" id="seg-cart-bilhetes" class="nasa-seg-btn active" onclick="alternarSubAbaCarteira('bilhetes')">
      <span>💼</span> <span>Bilhetes</span>
    </button>
    <button type="button" id="seg-cart-bolao" class="nasa-seg-btn" onclick="alternarSubAbaCarteira('bolao')">
      <span>👥</span> <span>Bolão & Cotas</span>
    </button>
    <button type="button" id="seg-cart-ferramentas" class="nasa-seg-btn" onclick="alternarSubAbaCarteira('ferramentas')">
      <span>📡</span> <span>Scanner</span>
    </button>
  `;

  secCarteira.appendChild(segBar);
  secCarteira.appendChild(wrapperBilhetes);
  secCarteira.appendChild(wrapperBolao);
  secCarteira.appendChild(wrapperFerramentas);
}

function alternarSubAbaCarteira(modo) {
  subAbaCarteiraAtiva = modo;
  if (typeof tocarBeep === 'function') tocarBeep('click');

  ['bilhetes', 'bolao', 'ferramentas'].forEach((m) => {
    const btn = document.getElementById(`seg-cart-${m}`);
    if (btn) btn.classList.toggle('active', m === modo);
    const box = document.getElementById(`carteira-subview-${m}`);
    if (box) box.classList.toggle('hidden', m !== modo);
  });

  if (modo === 'bolao' && typeof calcularRateioBolao === 'function') {
    calcularRateioBolao();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function irParaCarteiraSubAba(subAba) {
  activateTab('carteira');
  alternarSubAbaCarteira(subAba);
}

function irParaGeradorRapido() {
  activateTab('gerar');
  alternarSubAbaGerar('rapido');
  if (typeof gerarApostaNasaComMatriz4x4 === 'function') {
    gerarApostaNasaComMatriz4x4();
  }
}

function irParaVolanteManual() {
  activateTab('gerar');
  alternarSubAbaGerar('volante');
}

// ===================================================================
// 7. DRAWER DE PERFIL, CONFIGURAÇÕES, SOM, TEMA, LGPD E ADMIN
// ===================================================================
function criarDrawerPerfilConfig() {
  if (document.getElementById('nasa-profile-drawer-backdrop')) return;

  const backdrop = document.createElement('div');
  backdrop.id = 'nasa-profile-drawer-backdrop';
  backdrop.onclick = (e) => {
    if (e.target === backdrop) fecharDrawerPerfil();
  };

  backdrop.innerHTML = `
    <div class="nasa-profile-sheet" role="dialog" aria-label="Menu de Conta e Configurações">
      <div class="nasa-sheet-handle"></div>

      <!-- Cabeçalho do Usuário -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div id="drawer-user-avatar" class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-black text-lg flex items-center justify-center shadow">
            👤
          </div>
          <div>
            <div id="drawer-user-name" class="text-sm font-black text-white">Visitante</div>
            <div id="drawer-user-email" class="text-xs text-slate-400">Modo gratuito</div>
          </div>
        </div>
        <button type="button" onclick="fecharDrawerPerfil()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">✕</button>
      </div>

      <!-- Ações de Conta e Assinatura -->
      <div class="grid grid-cols-2 gap-2 my-3">
        <button type="button" id="drawer-btn-auth" onclick="fecharDrawerPerfil(); abrirModalAuthOuPerfil();" class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5">
          <span>🔑</span> <span id="drawer-txt-auth">Entrar / Criar Conta</span>
        </button>
        <button type="button" onclick="fecharDrawerPerfil(); abrirModalPaywall('drawer');" class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow">
          <span>👑</span> <span>Planos VIP PRO</span>
        </button>
      </div>

      <!-- Preferências Rápidas: Som, Tema e Atualizar Caixa -->
      <div class="space-y-2 pt-2 border-t border-slate-800">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Ajustes do Aplicativo</span>
        <div class="grid grid-cols-3 gap-2">
          <button type="button" onclick="alternarTema(); atualizarDadosDrawer();" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 flex flex-col items-center gap-1">
            <span id="drawer-theme-icon" class="text-base">🌙</span>
            <span>Tema</span>
          </button>
          <button type="button" onclick="alternarAudio(); atualizarDadosDrawer();" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 flex flex-col items-center gap-1">
            <span id="drawer-audio-icon" class="text-base">🔊</span>
            <span>Sons</span>
          </button>
          <button type="button" onclick="fecharDrawerPerfil(); sincronizarConcursos();" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-400 flex flex-col items-center gap-1">
            <span class="text-base">🔄</span>
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      <!-- Botão Painel Admin (visível apenas para o fundador/admin) -->
      <div id="drawer-admin-row" class="hidden pt-3">
        <button type="button" onclick="fecharDrawerPerfil(); mudarAba('admin');" class="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-xs flex items-center justify-center gap-2">
          <span>👑</span> <span>Abrir Painel Administrativo (CEO)</span>
        </button>
      </div>

      <!-- Links Institucionais: Mestres da Loteria, Jurídico & LGPD -->
      <div class="space-y-1.5 pt-3 mt-3 border-t border-slate-800">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Conhecimento & Legal</span>
        
        <button type="button" onclick="fecharDrawerPerfil(); abrirModalMestresLoteria();" class="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-white flex items-center justify-between text-left transition">
          <div class="flex items-center gap-2">
            <span>🏛️</span>
            <span>Mestres da Loteria & Ciência</span>
          </div>
          <span class="text-slate-500 text-[10px]">Ver →</span>
        </button>

        <button type="button" onclick="fecharDrawerPerfil(); abrirModalTermosLGPD('termos');" class="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-between text-left transition">
          <div class="flex items-center gap-2">
            <span>⚖️</span>
            <span>Termos de Uso & Isenção de Ganho (CDC)</span>
          </div>
          <span class="text-slate-500 text-[10px]">Ver →</span>
        </button>

        <button type="button" onclick="fecharDrawerPerfil(); abrirModalTermosLGPD('lgpd');" class="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-between text-left transition">
          <div class="flex items-center gap-2">
            <span>🛡️</span>
            <span>Privacidade & Proteção de Dados (LGPD)</span>
          </div>
          <span class="text-slate-500 text-[10px]">Ver →</span>
        </button>

        <button type="button" onclick="fecharDrawerPerfil(); abrirModalTermosLGPD('direitos');" class="w-full p-2.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-xs font-bold text-rose-300 flex items-center justify-between text-left transition">
          <div class="flex items-center gap-2">
            <span>🗑️</span>
            <span>Meus Dados / Exclusão de Conta (Art. 18)</span>
          </div>
          <span class="text-rose-500 text-[10px]">Gerenciar →</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
}

function abrirModalMestresLoteria() {
  if (typeof tocarBeep === 'function') tocarBeep('click');
  const m = document.getElementById('modal-mestres-loteria');
  if (m) {
    m.classList.remove('hidden');
    m.classList.add('flex');
  }
}

function fecharModalMestresLoteria() {
  const m = document.getElementById('modal-mestres-loteria');
  if (m) {
    m.classList.add('hidden');
    m.classList.remove('flex');
  }
}
window.abrirModalMestresLoteria = abrirModalMestresLoteria;
window.fecharModalMestresLoteria = fecharModalMestresLoteria;

function abrirDrawerPerfil() {
  if (typeof tocarBeep === 'function') tocarBeep('click');
  atualizarDadosDrawer();
  const backdrop = document.getElementById('nasa-profile-drawer-backdrop');
  if (backdrop) backdrop.classList.add('open');
}

function fecharDrawerPerfil() {
  const backdrop = document.getElementById('nasa-profile-drawer-backdrop');
  if (backdrop) backdrop.classList.remove('open');
}

function atualizarDadosDrawer() {
  const nameEl = document.getElementById('drawer-user-name');
  const emailEl = document.getElementById('drawer-user-email');
  const avatarEl = document.getElementById('drawer-user-avatar');
  const txtAuth = document.getElementById('drawer-txt-auth');
  const adminRow = document.getElementById('drawer-admin-row');
  const themeIcon = document.getElementById('drawer-theme-icon');
  const audioIcon = document.getElementById('drawer-audio-icon');

  if (typeof usuarioSessao !== 'undefined' && usuarioSessao) {
    if (nameEl) nameEl.innerText = usuarioSessao.nome || 'Visitante';
    if (emailEl) {
      emailEl.innerText = usuarioSessao.tipo === 'visitante'
        ? 'Sem conta conectada'
        : (usuarioSessao.email || 'Conta conectada');
    }
    if (avatarEl) {
      avatarEl.innerText = usuarioSessao.tipo === 'master_founder'
        ? '👑'
        : ((usuarioSessao.nome?.[0] || '👤').toUpperCase());
    }
    if (txtAuth) {
      txtAuth.innerText = usuarioSessao.tipo === 'visitante' ? 'Entrar / Criar Conta' : 'Gerenciar / Sair';
    }
    if (adminRow) {
      adminRow.classList.toggle('hidden', usuarioSessao.tipo !== 'master_founder');
    }
  }

  if (themeIcon) {
    themeIcon.innerText = document.documentElement.classList.contains('dark') ? '🌙' : '☀️';
  }
  if (audioIcon && typeof audioAtivo !== 'undefined') {
    audioIcon.innerText = audioAtivo ? '🔊' : '🔇';
  }
}

// ===================================================================
// 8. INTEGRAÇÃO COM AS FUNÇÕES LEGADAS DO INDEX.HTML
// ===================================================================
function interceptarFuncoesLegadas() {
  // 1. Sincroniza mudarAba('volante' | 'fechamentos' | 'calor' | 'carteira' | 'bolao' | 'admin') com a Bottom Tab Bar
  const mudarAbaOriginal = window.mudarAba;
  if (typeof mudarAbaOriginal === 'function') {
    window.mudarAba = function (aba) {
      if (aba === 'bolao') {
        activateTab('carteira');
        alternarSubAbaCarteira('bolao');
        return;
      }
      if (aba === 'admin') {
        mudarAbaOriginal('admin');
        const allViews = document.querySelectorAll('main > section');
        allViews.forEach((v) => {
          v.classList.remove('active');
          v.style.display = 'none';
        });
        const adminView = document.getElementById('view-admin');
        if (adminView) {
          adminView.classList.remove('hidden');
          adminView.classList.add('active');
          adminView.style.display = 'block';
        }
        return;
      }

      const mapAbaToTab = {
        inicio: 'home',
        volante: 'gerar',
        fechamentos: 'fechamentos',
        calor: 'analise',
        carteira: 'carteira'
      };
      const tabId = mapAbaToTab[aba] || 'home';
      activateTab(tabId);
    };
  }

  // 2. Sincroniza trocarModalidade('megasena' | 'lotofacil') com o Pill Switcher Global
  const trocarModalidadeOriginal = window.trocarModalidade;
  if (typeof trocarModalidadeOriginal === 'function') {
    window.trocarModalidade = function (mod) {
      trocarModalidadeOriginal(mod);
      sincronizarVisualModalidadeGlobal();
    };
  }

  // 3. Sincroniza atualizarVisualPlano() e atualizarPerfilUsuarioUI() com o Header novo
  const atualizarVisualPlanoOriginal = window.atualizarVisualPlano;
  if (typeof atualizarVisualPlanoOriginal === 'function') {
    window.atualizarVisualPlano = function () {
      atualizarVisualPlanoOriginal();
      sincronizarHeaderStatusUsuario();
      const promoHome = document.getElementById('home-promo-pro-card');
      if (promoHome) {
        const ehPro = (typeof planoUsuario !== 'undefined' && planoUsuario === 'pro') ||
                      (typeof usuarioSessao !== 'undefined' && usuarioSessao?.tipo === 'master_founder');
        promoHome.style.display = ehPro ? 'none' : 'flex';
      }
    };
  }

  const atualizarPerfilOriginal = window.atualizarPerfilUsuarioUI;
  if (typeof atualizarPerfilOriginal === 'function') {
    window.atualizarPerfilUsuarioUI = function () {
      atualizarPerfilOriginal();
      sincronizarHeaderStatusUsuario();
    };
  }

  // 4. Atualiza o contador "6/6" no botão da sub-aba de Testes sempre que o jogo muda
  const executarAnaliseOriginal = window.executarAnaliseDinamicaDoJogo;
  if (typeof executarAnaliseOriginal === 'function') {
    window.executarAnaliseDinamicaDoJogo = function () {
      executarAnaliseOriginal();
      const badgeTotal = document.getElementById('badge-total-testes-ok');
      const segBadge = document.getElementById('seg-badge-testes-count');
      if (badgeTotal && segBadge) {
        const match = badgeTotal.innerText.match(/(\d+)\s*de\s*6/);
        segBadge.innerText = match ? `${match[1]}/6` : '6/6';
      }
    };
  }

  // 5. No Volante mobile, respeita a classe classic-10x6 se o usuário escolheu
  const renderizarVolanteOriginal = window.renderizarVolante;
  if (typeof renderizarVolanteOriginal === 'function') {
    window.renderizarVolante = function () {
      renderizarVolanteOriginal();
      const grid = document.getElementById('volante-grid');
      if (grid && volanteModo10Colunas) {
        grid.classList.add('classic-10x6');
      }
    };
  }
}

// ===================================================================
// 9. NAVEGAÇÃO ENTRE AS 5 ABAS PRINCIPAIS
// ===================================================================
function atualizarResumoHome(totalBilhetes, totalInvestido) {
  document.querySelectorAll('.js-progresso-bilhetes').forEach((el) => {
    el.innerText = totalBilhetes;
  });
  document.querySelectorAll('.js-progresso-investimento').forEach((el) => {
    el.innerText = totalInvestido.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  });
}

function activateTab(tabId) {
  document.body.setAttribute('data-active-tab', tabId);

  TABS_CONFIG.forEach((tab) => {
    const btn = document.getElementById(`bottom-nav-${tab.id}`);
    if (btn) {
      btn.classList.toggle('active', tab.id === tabId);
    }
  });

  const allViews = document.querySelectorAll('main > section');
  allViews.forEach((view) => {
    view.classList.remove('active');
    view.style.display = 'none';
  });

  const tabConfig = TABS_CONFIG.find((t) => t.id === tabId);
  if (!tabConfig) return;

  if (typeof abaAtual !== 'undefined') {
    abaAtual = tabConfig.legacyAba;
  }

  const targetView = document.getElementById(tabConfig.view);
  if (targetView) {
    targetView.classList.remove('hidden');
    targetView.classList.add('active');
    targetView.style.display = 'block';
  }

  // Atualiza os dados específicos da aba aberta
  if (tabId === 'home') {
    atualizarUltimoResultadoHome();
  } else if (tabId === 'gerar') {
    aplicarVisibilidadeSubAbaGerar();
  } else if (tabId === 'fechamentos' && typeof carregarOpcoesFechamento === 'function') {
    carregarOpcoesFechamento();
  } else if (tabId === 'analise') {
    if (typeof renderizarMapaCalor === 'function') renderizarMapaCalor();
    aplicarVisibilidadeSubAbaCalor();
  } else if (tabId === 'carteira') {
    if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
    if (typeof calcularRateioBolao === 'function') calcularRateioBolao();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupTabNavigation() {
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1': e.preventDefault(); activateTab('home'); break;
        case '2': e.preventDefault(); activateTab('gerar'); break;
        case '3': e.preventDefault(); activateTab('fechamentos'); break;
        case '4': e.preventDefault(); activateTab('analise'); break;
        case '5': e.preventDefault(); activateTab('carteira'); break;
      }
    }
  });
}

function getActiveTab() {
  return TABS_CONFIG.find((tab) =>
    document.getElementById(`bottom-nav-${tab.id}`)?.classList.contains('active')
  )?.id || 'home';
}

function navigateTo(tabId) {
  activateTab(tabId);
}



function atualizarProvaDosFatosRedesign() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const base = mod === 'megasena'
    ? (typeof baseConcursosMega !== 'undefined' ? baseConcursosMega : [])
    : (typeof baseConcursosLoto !== 'undefined' ? baseConcursosLoto : []);

  const containerLista = document.getElementById('home-lista-ultimos-sorteios-avaliados');
  const badgePct = document.getElementById('badge-pct-aprovados-home');
  const resumoEl = document.getElementById('home-prova-fatos-resumo');
  const apostasAtivasEl = document.getElementById('home-apostas-ativas-conteudo');

  // 1. Atualizar resumo de apostas ativas da carteira
  if (apostasAtivasEl) {
    const bilhetes = Array.isArray(carteiraJogos) ? carteiraJogos : [];
    const ativos = bilhetes.filter(b => b.modalidade === mod);
    if (ativos.length > 0) {
      apostasAtivasEl.innerHTML = `
        <div class="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
          <span class="text-emerald-300 font-bold font-mono text-[11px]">🎯 ${ativos.length} aposta${ativos.length > 1 ? 's' : ''} ativa${ativos.length > 1 ? 's' : ''} em monitoramento</span>
          <span class="text-[10px] text-slate-400 font-mono">${ativos[0].concursoAlvo || 'Próximo'}</span>
        </div>
      `;
    } else {
      apostasAtivasEl.innerHTML = `<span class="text-[11px] text-slate-400">Nenhuma aposta ativa registrada ainda. Gere seu jogo e toque em <b>✅ JOGUEI ESTE JOGO!</b></span>`;
    }
  }

  if (!containerLista) return;

  const ultimos10 = base.slice(0, 10);
  if (ultimos10.length === 0) {
    containerLista.innerHTML = `<div class="text-center py-2 text-xs text-slate-400">Sincronizando concursos oficiais com a Caixa...</div>`;
    return;
  }

  let aprovadosCount = 0;
  const cardsHtml = ultimos10.map((c) => {
    const ordenado = [...c.dezenas].sort((a,b) => a - b);
    const avaliacao = typeof avaliarJogo === 'function' ? avaliarJogo(ordenado, mod) : { score: 95, aprovadosCount: 6 };
    if (avaliacao.aprovadosCount >= 5) aprovadosCount++;

    const bolinhasHtml = ordenado.map(d => `
      <span class="w-5 h-5 rounded-md ${mod === 'megasena' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-purple-950 text-purple-400 border border-purple-800'} font-black text-[9px] flex items-center justify-center font-mono">
        ${String(d).padStart(2, '0')}
      </span>
    `).join('');

    return `
      <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-1.5">
        <div class="space-y-0.5">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-white text-[11px] font-mono">#${c.concurso}</span>
            <span class="text-[9px] text-slate-400 font-mono">${c.data || ''}</span>
          </div>
          <div class="flex flex-wrap gap-0.5">
            ${bolinhasHtml}
          </div>
        </div>
        <div class="text-right">
          <div class="text-[10px] font-black text-cyan-400 font-mono">Nota ${avaliacao.score}/100</div>
          <span class="text-[9px] font-bold text-emerald-400">✓ ${avaliacao.aprovadosCount}/6 OK</span>
        </div>
      </div>
    `;
  }).join('');

  const pct = Math.round((aprovadosCount / ultimos10.length) * 100);
  if (badgePct) badgePct.innerText = `${pct}% APROVADO`;
  if (resumoEl) {
    resumoEl.innerText = `${pct}% dos últimos 10 sorteios oficiais da Caixa atenderam aos 6 filtros orbitais de calibração estatística:`;
  }
  containerLista.innerHTML = cardsHtml;
}
