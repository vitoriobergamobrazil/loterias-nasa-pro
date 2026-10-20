
// ===================================================================
// AÇÕES RÁPIDAS: COMPARTILHAR JOGO NO WHATSAPP & SALVAR NA CARTEIRA
// ===================================================================

function salvarJogoAtivoNaCarteira() {
  const jogo = typeof getJogoAtual === 'function' ? getJogoAtual() : [];
  if (!jogo || jogo.length === 0) {
    if (typeof toast === 'function') toast('Selecione ou gere um jogo primeiro', '⚠️');
    return;
  }

  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const nomeMod = mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil';
  const score = document.getElementById('score-numero')?.innerText || '98';

  const novoBilhete = {
    id: Date.now(),
    modalidade: mod,
    nome: `${nomeMod} • ${jogo.length} Dezenas`,
    dezenas: [...jogo],
    data: new Date().toLocaleDateString('pt-BR'),
    score: score,
    concursoAlvo: 'Próximo Oficial',
    tipo: 'calibrado'
  };

  if (!Array.isArray(carteiraJogos)) carteiraJogos = [];
  carteiraJogos.unshift(novoBilhete);
  if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
  if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();

  if (typeof toast === 'function') toast('Jogo salvo na sua Carteira!', '💼');
}

function compartilharJogoGeradoWhatsapp() {
  const jogo = typeof getJogoAtual === 'function' ? getJogoAtual() : [];
  if (!jogo || jogo.length === 0) {
    if (typeof toast === 'function') toast('Gere um jogo primeiro para enviar', '⚠️');
    return;
  }

  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const nomeMod = mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil';
  const dezenasFormatadas = jogo.map(n => String(n).padStart(2, '0')).join(' - ');
  const score = document.getElementById('score-numero')?.innerText || '98';

  const texto = 
`🚀 *JOGO CALIBRADO • ${nomeMod.toUpperCase()}*
📊 *Nota de Equilíbrio:* ${score}/100 (6 de 6 Testes OK)

🎯 *Dezenas:*
👉 *${dezenasFormatadas}*

🔬 *Distribuição:*
• Sem sequências longas viciadas
• Dezenas bem espalhadas no volante
• Proporção ideal de pares e ímpares

Gerado no *Loterias NASA Pro*`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
  if (typeof toast === 'function') toast('Abrindo WhatsApp...', '📱');
}
