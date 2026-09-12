// ===================================================================
// MENU FIX - Garante que bottom-tab-bar nunca desaparece
// ===================================================================
// Problema: em alguns pontos da navegação, o menu some
// Solução: monitor contínuo + força visibilidade sempre

const MENU_FIX_CONFIG = {
  checkInterval: 500, // ms
  zIndexTarget: 50,
  requiredProperties: {
    display: 'grid',
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    zIndex: '50'
  }
};

function verificarVisibilidadeMenu() {
  const menu = document.getElementById('bottom-tab-bar');
  if (!menu) {
    console.warn('⚠️ bottom-tab-bar não encontrado');
    return;
  }

  const computedStyle = window.getComputedStyle(menu);
  const isHidden =
    computedStyle.display === 'none' ||
    computedStyle.visibility === 'hidden' ||
    computedStyle.opacity === '0' ||
    parseInt(computedStyle.zIndex) < MENU_FIX_CONFIG.zIndexTarget;

  if (isHidden) {
    console.warn('🔴 Menu ocultado detectado! Restaurando...');
    restaurarMenu();
  }
}

function restaurarMenu() {
  const menu = document.getElementById('bottom-tab-bar');
  if (!menu) return;

  // Force all required styles
  Object.assign(menu.style, {
    display: 'grid',
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    zIndex: '50',
    visibility: 'visible',
    opacity: '1',
    pointerEvents: 'auto'
  });

  // Garantir que todos os botões estejam clicáveis
  menu.querySelectorAll('.bottom-tab-btn').forEach(btn => {
    Object.assign(btn.style, {
      display: 'flex',
      pointerEvents: 'auto',
      cursor: 'pointer',
      zIndex: 'auto'
    });
  });

  console.log('✅ Menu restaurado');
}

// ===================================================================
// MONITORAR CONTINUAMENTE
// ===================================================================
let menuMonitorInterval = null;

function iniciarMonitorMenu() {
  if (menuMonitorInterval) clearInterval(menuMonitorInterval);

  menuMonitorInterval = setInterval(() => {
    verificarVisibilidadeMenu();
  }, MENU_FIX_CONFIG.checkInterval);

  console.log('📍 Menu monitor iniciado');
}

function pararMonitorMenu() {
  if (menuMonitorInterval) {
    clearInterval(menuMonitorInterval);
    menuMonitorInterval = null;
    console.log('⏸️ Menu monitor parado');
  }
}

// ===================================================================
// OBSERVERS: Detectar mudanças no DOM/CSS
// ===================================================================
function observarMudancasMenu() {
  const menu = document.getElementById('bottom-tab-bar');
  if (!menu) return;

  // Observer de atributos (style, class)
  const attrObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        // Se alguém alterou style ou class, verificar
        setTimeout(verificarVisibilidadeMenu, 100);
      }
    });
  });

  attrObserver.observe(menu, {
    attributes: true,
    attributeFilter: ['style', 'class'],
    subtree: false
  });

  console.log('👁️ Observers ativados no menu');
}

// ===================================================================
// INICIALIZAR NA PÁGINA
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    restaurarMenu();
    iniciarMonitorMenu();
    observarMudancasMenu();

    // Garantir que ao trocar de aba, menu fica visível
    document.querySelectorAll('.bottom-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(restaurarMenu, 100);
      });
    });
  }, 500);
});

// Exposar pra debugging no console
window.menuFix = {
  verificar: verificarVisibilidadeMenu,
  restaurar: restaurarMenu,
  iniciar: iniciarMonitorMenu,
  parar: pararMonitorMenu,
  status: () => {
    const menu = document.getElementById('bottom-tab-bar');
    if (!menu) return '❌ Menu não encontrado';
    const style = window.getComputedStyle(menu);
    return {
      display: style.display,
      visibility: style.visibility,
      zIndex: style.zIndex,
      position: style.position,
      bottom: style.bottom,
      opcidade: style.opacity
    };
  }
};

console.log('🛠️ Menu Fix loaded. Debug: window.menuFix.status()');
