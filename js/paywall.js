// js/paywall.js

const Paywall = {
  isPro: () => {
    const user = JSON.parse(localStorage.getItem('loterias_nasa_user'));
    return user && user.plano === 'pro';
  },

  checkAccess: (featureName) => {
    if (Paywall.isPro()) return true;

    // Show paywall modal
    const modal = document.getElementById('modal-paywall-pro');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      
      const motivo = document.getElementById('paywall-motivo-texto');
      if (motivo) {
        motivo.innerText = `Recurso "${featureName}" restrito a assinantes VIP. Desbloqueie todas as matrizes e a inteligência artificial da NASA.`;
      }
    }
    return false;
  }
};

function fecharModalPaywall() {
  const modal = document.getElementById('modal-paywall-pro');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function selecionarPlanoCheckout(plano) {
  console.log(`Plano selecionado: ${plano}`);
  // Implementar lógica de seleção de plano
}

function iniciarCheckoutCartaoRecorrente() {
  console.log('Iniciando checkout cartão...');
  // Implementar integração com gateway
}

function confirmarPagamentoPixSimulado() {
  console.log('Confirmando PIX...');
  // Implementar integração com gateway
}
