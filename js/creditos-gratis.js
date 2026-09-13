// ===================================================================
// CRÉDITOS DE ANÁLISE GRÁTIS — 3 por cadastro, sem prazo
// ===================================================================
// Substitui o trial de 3 dias (que só existia pra quem escolhia o plano
// Mensal) por um mecanismo único de "grátis" no app inteiro: toda conta
// nova ganha 3 análises completas, sem prazo de validade.
//
// O saldo mora no Supabase (coluna profiles.analises_gratis_restantes) e o
// consumo passa pela função consumir_analise_gratis(), que roda no servidor
// e só decrementa se houver saldo — o cliente nunca decide "quantos restam",
// só pergunta e recebe a resposta. Mesma lógica de não confiar no navegador
// para estado que importa, já usada no webhook de pagamento e na exclusão
// de conta deste projeto.

/** true se o usuário logado (não-PRO) ainda tem crédito para gastar. */
function temCreditoGratis() {
  return (
    typeof usuarioSessao !== 'undefined' &&
    usuarioSessao &&
    Number(usuarioSessao.creditosGratis) > 0
  );
}

/**
 * Consome 1 crédito no servidor. Retorna quantos restam (>= 0) em caso de
 * sucesso, ou null se não havia saldo (alguém pode ter gastado em outra
 * aba entre a checagem local e esta chamada — o servidor é quem decide).
 */
async function consumirCreditoGratis() {
  const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;
  if (!cliente) return null;

  try {
    const { data, error } = await cliente.rpc('consumir_analise_gratis');
    if (error) {
      console.warn('Falha ao consumir crédito grátis:', error.message);
      return null;
    }

    const restantes = data === null || data === undefined ? null : Number(data);

    if (typeof usuarioSessao !== 'undefined' && usuarioSessao) {
      usuarioSessao.creditosGratis = restantes ?? 0;
    }

    return restantes;
  } catch (err) {
    console.warn('Erro ao consumir crédito grátis:', err.message);
    return null;
  }
}

/**
 * Ponto de entrada dos cadeados de science-gate.js. Decide o que acontece
 * ao clicar num teste/painel travado, substituindo o "vai direto pro
 * paywall" que existia antes.
 */
async function tratarCliqueTravaCientifica(origem, revelarFn) {
  if (typeof usuarioSessao === 'undefined' || !usuarioSessao || usuarioSessao.tipo === 'visitante') {
    // Não logado: oferece o cadastro (o modal de upgrade já fala das
    // 3 análises grátis) — não há saldo de crédito pra checar ainda.
    if (typeof abrirModalPaywall === 'function') abrirModalPaywall(origem);
    return;
  }

  if (!temCreditoGratis()) {
    if (typeof abrirModalPaywall === 'function') abrirModalPaywall(origem);
    return;
  }

  const restantesAntes = usuarioSessao.creditosGratis;
  const confirmado = confirm(
    `Usar 1 análise grátis para ver o diagnóstico completo deste jogo?\n\n` +
    `Você tem ${restantesAntes} análise${restantesAntes === 1 ? '' : 's'} grátis restante${restantesAntes === 1 ? '' : 's'}.`
  );
  if (!confirmado) return;

  tocarBeep('click');
  const restantes = await consumirCreditoGratis();

  if (restantes === null) {
    // Alguém consumiu em outra aba, ou o saldo já tinha zerado no servidor.
    toast('Suas análises grátis acabaram.', '🔒');
    if (typeof abrirModalPaywall === 'function') abrirModalPaywall(origem);
    return;
  }

  revelarFn();
  tocarSomNasa('sucesso');
  toast(
    restantes > 0
      ? `Análise liberada! Restam ${restantes} grátis.`
      : 'Última análise grátis usada. As próximas exigem o plano PRO.',
    '🔬'
  );
}

console.log('🎟️ Créditos de análise grátis carregados');
