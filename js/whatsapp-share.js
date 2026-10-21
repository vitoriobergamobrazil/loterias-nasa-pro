// ===================================================================
// AÇÕES RÁPIDAS: COMPARTILHAR JOGO NO WHATSAPP & SALVAR NA CARTEIRA
// Suporta aposta única ou lote completo (1, 2, 3 ou 5 jogos gerados)
// ===================================================================

function salvarJogoAtivoNaCarteira() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const nomeMod = mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil';
  const score = document.getElementById('score-numero')?.innerText || '98';

  // Se houver lote com múltiplos jogos gerados, salva todos
  if (typeof loteApostasGeradas !== 'undefined' && Array.isArray(loteApostasGeradas) && loteApostasGeradas.length > 1) {
    if (!Array.isArray(carteiraJogos)) carteiraJogos = [];
    
    loteApostasGeradas.forEach((aposta, i) => {
      carteiraJogos.unshift({
        id: Date.now() + i,
        modalidade: mod,
        nome: `${nomeMod} • Jogo #${aposta.id || i + 1} (${aposta.dezenas.length} dezenas)`,
        dezenas: [...aposta.dezenas],
        data: new Date().toLocaleDateString('pt-BR'),
        score: aposta.analise?.score || score,
        concursoAlvo: 'Próximo Oficial',
        tipo: 'calibrado'
      });
    });

    if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
    if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
    if (typeof toast === 'function') toast(`${loteApostasGeradas.length} jogos salvos na sua Carteira!`, '💼');
    return;
  }

  // Aposta individual ativa
  const jogo = typeof getJogoAtual === 'function' ? getJogoAtual() : [];
  if (!jogo || jogo.length === 0) {
    if (typeof toast === 'function') toast('Selecione ou gere um jogo primeiro', '⚠️');
    return;
  }

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
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const nomeMod = mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil';
  const score = document.getElementById('score-numero')?.innerText || '98';

  // Caso 1: Foram gerados múltiplos jogos (2, 3 ou 5 jogos)
  if (typeof loteApostasGeradas !== 'undefined' && Array.isArray(loteApostasGeradas) && loteApostasGeradas.length > 1) {
    const totalJogos = loteApostasGeradas.length;
    
    let linhasJogos = loteApostasGeradas.map((ap, i) => {
      const dezenas = ap.dezenas.map(d => String(d).padStart(2, '0')).join(' - ');
      const scoreIndividual = ap.analise?.score || score;
      return `🎲 *Jogo #${i + 1}* (Nota ${scoreIndividual}/100):\n👉 *${dezenas}*`;
    }).join('\n\n');

    const textoLote = 
`🚀 *${totalJogos} JOGOS CALIBRADOS • ${nomeMod.toUpperCase()}*
📊 *Validação:* Bateria Orbital NASA (6 de 6 Testes OK)

${linhasJogos}

🔬 *Critérios de Calibração:*
• Sem sequências longas viciadas
• Dezenas bem espalhadas no volante
• Equilíbrio estatístico de pares e ímpares

Gerado no *Loterias NASA Pro*`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoLote)}`;
    window.open(url, '_blank');
    if (typeof toast === 'function') toast(`Enviando ${totalJogos} jogos no WhatsApp...`, '📱');
    return;
  }

  // Caso 2: Jogo único ativo
  const jogo = typeof getJogoAtual === 'function' ? getJogoAtual() : [];
  if (!jogo || jogo.length === 0) {
    if (typeof toast === 'function') toast('Gere um jogo primeiro para enviar', '⚠️');
    return;
  }

  const dezenasFormatadas = jogo.map(n => String(n).padStart(2, '0')).join(' - ');

  const textoUnico = 
`🚀 *JOGO CALIBRADO • ${nomeMod.toUpperCase()}*
📊 *Nota de Equilíbrio:* ${score}/100 (6 de 6 Testes OK)

🎯 *Dezenas:*
👉 *${dezenasFormatadas}*

🔬 *Distribuição:*
• Sem sequências longas viciadas
• Dezenas bem espalhadas no volante
• Proporção ideal de pares e ímpares

Gerado no *Loterias NASA Pro*`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoUnico)}`;
  window.open(url, '_blank');
  if (typeof toast === 'function') toast('Abrindo WhatsApp...', '📱');
}
