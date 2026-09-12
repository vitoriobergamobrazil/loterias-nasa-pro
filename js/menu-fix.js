// ===================================================================
// MENU FIX - rede de segurança para a bottom tab bar
// ===================================================================
// A causa raiz do menu sumir foi corrigida no CSS (redesign.css marca as
// propriedades do #bottom-tab-bar como !important com z-index acima dos
// modais). Este arquivo é só a rede de proteção: reage a mudanças em vez
// de fazer polling, para não gastar bateria no celular.

const MENU_Z_INDEX_MINIMO = 50;

const MENU_ESTILO_ESPERADO = {
  display: 'grid',
  position: 'fixed',
  bottom: '0',
  left: '0',
  right: '0',
  zIndex: String(MENU_Z_INDEX_MINIMO),
  visibility: 'visible',
  opacity: '1',
  pointerEvents: 'auto'
};

let restaurandoMenu = false;

function menuEstaOculto(menu) {
  const estilo = window.getComputedStyle(menu);
  return (
    estilo.display === 'none' ||
    estilo.visibility === 'hidden' ||
    parseFloat(estilo.opacity) === 0 ||
    parseInt(estilo.zIndex, 10) < MENU_Z_INDEX_MINIMO
  );
}

function restaurarMenu() {
  const menu = document.getElementById('bottom-tab-bar');
  if (!menu) return;

  // Evita que o próprio MutationObserver reaja à correção e entre em laço.
  restaurandoMenu = true;
  Object.assign(menu.style, MENU_ESTILO_ESPERADO);

  menu.querySelectorAll('.bottom-tab-btn').forEach((btn) => {
    btn.style.display = 'flex';
    btn.style.pointerEvents = 'auto';
  });

  requestAnimationFrame(() => {
    restaurandoMenu = false;
  });
}

function verificarVisibilidadeMenu() {
  if (restaurandoMenu) return;

  const menu = document.getElementById('bottom-tab-bar');
  if (!menu) return;

  if (menuEstaOculto(menu)) {
    console.warn('Menu ficou oculto — restaurando');
    restaurarMenu();
  }
}

function observarMudancasMenu() {
  const menu = document.getElementById('bottom-tab-bar');
  if (!menu) return;

  new MutationObserver(() => {
    if (!restaurandoMenu) verificarVisibilidadeMenu();
  }).observe(menu, {
    attributes: true,
    attributeFilter: ['style', 'class', 'hidden']
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // redesign.js cria a tab bar no DOMContentLoaded; espera o próximo frame.
  requestAnimationFrame(() => {
    verificarVisibilidadeMenu();
    observarMudancasMenu();

    document.querySelectorAll('.bottom-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () =>
        requestAnimationFrame(verificarVisibilidadeMenu)
      );
    });
  });
});

// Momentos em que um modal pode ter deixado estado sujo para trás.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) verificarVisibilidadeMenu();
});
window.addEventListener('pageshow', verificarVisibilidadeMenu);
window.addEventListener('orientationchange', () =>
  setTimeout(verificarVisibilidadeMenu, 200)
);

window.menuFix = {
  verificar: verificarVisibilidadeMenu,
  restaurar: restaurarMenu,
  status: () => {
    const menu = document.getElementById('bottom-tab-bar');
    if (!menu) return 'Menu não encontrado';
    const estilo = window.getComputedStyle(menu);
    return {
      display: estilo.display,
      visibility: estilo.visibility,
      opacity: estilo.opacity,
      zIndex: estilo.zIndex,
      position: estilo.position,
      oculto: menuEstaOculto(menu)
    };
  }
};

console.log('🛠️ Menu fix ativo. Debug: window.menuFix.status()');
