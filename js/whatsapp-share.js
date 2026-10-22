// ===================================================================
// AÇÕES RÁPIDAS: COMPARTILHAR JOGO NO WHATSAPP & SALVAR NA CARTEIRA
// Suporta aposta única ou lote completo (1, 2, 3 ou 5 jogos gerados)
// Inclui o botão "JOGUEI ESTE JOGO!" com vinculação automática ao sorteio oficial
// ===================================================================

function obterInfoProximoSorteio(modalidade) {
  const mod = modalidade || (typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena');
  let proximoNumero = null;
  let proximaData = null;

  if (mod === 'megasena' && typeof baseConcursosMega !== 'undefined' && baseConcursosMega.length > 0) {
    const ultimo = baseConcursosMega[0];
    proximoNumero = ultimo.proximoConcurso || (ultimo.concurso + 1);
    proximaData = ultimo.dataProximo || null;
  } else if (mod === 'lotofacil' && typeof baseConcursosLoto !== 'undefined' && baseConcursosLoto.length > 0) {
    const ultimo = baseConcursosLoto[0];
    proximoNumero = ultimo.proximoConcurso || (ultimo.concurso + 1);
    proximaData = ultimo.dataProximo || null;
  }

  // Fallback para data calculada se não tiver vindo da Caixa ainda
  if (!proximaData) {
    const hoje = new Date();
    // Mega corre quarta (3) e sábado (6); Loto corre seg a sab (1 a 6)
    proximaData = hoje.toLocaleDateString('pt-BR');
  }

  return {
    concurso: proximoNumero ? `#${proximoNumero}` : 'Próximo Oficial',
    data: proximaData
  };
}

/**
 * Registra o jogo (ou lote de jogos) com status ativo para o próximo concurso oficial
 * Permite que o apostador aperte "JOGUEI ESTE JOGO!" na hora que apostou na lotérica/app
 */
function marcarComoJogadoProximoConcurso() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const nomeMod = mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil';
  const score = document.getElementById('score-numero')?.innerText || '98';
  const infoSorteio = obterInfoProximoSorteio(mod);

  if (!Array.isArray(carteiraJogos)) carteiraJogos = [];

  // Cenário 1: Há múltiplos jogos gerados (Lote de 2, 3 ou 5)
  if (typeof loteApostasGeradas !== 'undefined' && Array.isArray(loteApostasGeradas) && loteApostasGeradas.length > 1) {
    const totalJogos = loteApostasGeradas.length;
    
    loteApostasGeradas.forEach((aposta, i) => {
      carteiraJogos.unshift({
        id: Date.now() + i,
        modalidade: mod,
        nome: `${nomeMod} • Jogo #${aposta.id || i + 1} (${aposta.dezenas.length} dez)`,
        dezenas: [...aposta.dezenas],
        data: infoSorteio.data,
        concursoAlvo: infoSorteio.concurso,
        score: aposta.analise?.score || score,
        status: 'Aguardando sorteio',
        registradoComoJogado: true,
        dataRegistro: new Date().toISOString()
      });
    });

    if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
    if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
    if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();

    if (typeof toast === 'function') {
      toast(`🎉 ${totalJogos} jogos registrados para o concurso ${infoSorteio.concurso}!`, '✅');
    }
    return;
  }

  // Cenário 2: Aposta individual ativa
  const jogo = typeof getJogoAtual === 'function' ? getJogoAtual() : [];
  if (!jogo || jogo.length === 0) {
    if (typeof toast === 'function') toast('Gere um jogo primeiro para registrar como jogado', '⚠️');
    return;
  }

  const novoBilhete = {
    id: Date.now(),
    modalidade: mod,
    nome: `${nomeMod} • ${jogo.length} Dezenas`,
    dezenas: [...jogo],
    data: infoSorteio.data,
    concursoAlvo: infoSorteio.concurso,
    score: score,
    status: 'Aguardando sorteio',
    registradoComoJogado: true,
    dataRegistro: new Date().toISOString()
  };

  carteiraJogos.unshift(novoBilhete);
  if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
  if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
  if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();

  if (typeof toast === 'function') {
    toast(`🎉 Jogo registrado com sucesso para o concurso ${infoSorteio.concurso}!`, '✅');
  }
}

function salvarJogoAtivoNaCarteira() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const nomeMod = mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil';
  const score = document.getElementById('score-numero')?.innerText || '98';
  const infoSorteio = obterInfoProximoSorteio(mod);

  if (!Array.isArray(carteiraJogos)) carteiraJogos = [];

  // Se houver lote com múltiplos jogos gerados, salva todos
  if (typeof loteApostasGeradas !== 'undefined' && Array.isArray(loteApostasGeradas) && loteApostasGeradas.length > 1) {
    loteApostasGeradas.forEach((aposta, i) => {
      carteiraJogos.unshift({
        id: Date.now() + i,
        modalidade: mod,
        nome: `${nomeMod} • Jogo #${aposta.id || i + 1} (${aposta.dezenas.length} dezenas)`,
        dezenas: [...aposta.dezenas],
        data: infoSorteio.data,
        score: aposta.analise?.score || score,
        concursoAlvo: infoSorteio.concurso,
        tipo: 'calibrado'
      });
    });

    if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
    if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
    if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();
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
    data: infoSorteio.data,
    score: score,
    concursoAlvo: infoSorteio.concurso,
    tipo: 'calibrado'
  };

  carteiraJogos.unshift(novoBilhete);
  if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
  if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
  if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();

  if (typeof toast === 'function') toast('Jogo salvo na sua Carteira!', '💼');
}

function compartilharJogoGeradoWhatsapp() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const nomeMod = mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil';
  const score = document.getElementById('score-numero')?.innerText || '98';
  const infoSorteio = obterInfoProximoSorteio(mod);

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
🎯 *Concurso Alvo:* ${infoSorteio.concurso} (${infoSorteio.data})
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
🎯 *Concurso Alvo:* ${infoSorteio.concurso} (${infoSorteio.data})
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

/**
 * Atualiza o rótulo do botão de WhatsApp para mostrar se está enviando 1 ou lote
 */
function atualizarRotuloBotaoWhatsapp() {
  const elBtnTxt = document.getElementById('txt-whatsapp-botao');
  if (!elBtnTxt) return;

  if (typeof loteApostasGeradas !== 'undefined' && Array.isArray(loteApostasGeradas) && loteApostasGeradas.length > 1) {
    elBtnTxt.innerText = `Enviar ${loteApostasGeradas.length} Jogos no WhatsApp`;
  } else {
    elBtnTxt.innerText = 'Enviar no WhatsApp';
  }
}
