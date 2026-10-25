// =========================================================================
// LOTERIAS NASA PRO — GESTÃO INTELIGENTE DE CARTEIRA (HIGH-CAPACITY UX)
// Suporta de 1 a 500+ apostas com agrupamento por concurso, filtros e busca
// =========================================================================
(function () {
  'use strict';

  window.carteiraFiltros = {
    modalidade: 'todas', // 'todas', 'megasena', 'lotofacil'
    status: 'todos',     // 'todos', 'pendente', 'premiado'
    modo: 'agrupado',    // 'agrupado' (por concurso) ou 'lista' (plano)
    busca: '',
    gruposAbertos: {}
  };

  window.alternarModoCarteira = function (novoModo) {
    window.carteiraFiltros.modo = novoModo;
    if (typeof window.tocarBeep === 'function') window.tocarBeep('click');
    window.atualizarPainelCarteira();
  };

  window.setFiltroModalidadeCarteira = function (mod) {
    window.carteiraFiltros.modalidade = mod;
    if (typeof window.tocarBeep === 'function') window.tocarBeep('click');
    window.atualizarPainelCarteira();
  };

  window.setFiltroStatusCarteira = function (st) {
    window.carteiraFiltros.status = st;
    if (typeof window.tocarBeep === 'function') window.tocarBeep('click');
    window.atualizarPainelCarteira();
  };

  window.filtrarCarteiraBusca = function (texto) {
    const limpo = (texto || '').trim();
    const ehMensagemCompleta = limpo.includes('JOGOS') || limpo.includes('Jogo #') || limpo.includes('👉') || (limpo.split(/\n/).length >= 2) || (limpo.match(/\d+/g) || []).length >= 10;
    
    let avisoBox = document.getElementById('aviso-busca-jogos-colados');
    if (ehMensagemCompleta) {
      if (typeof window.parsearJogosTextoCompleto === 'function') {
        const res = window.parsearJogosTextoCompleto(limpo);
        if (res.jogos && res.jogos.length > 0) {
          if (!avisoBox) {
            const inputBusca = document.querySelector('input[oninput*="filtrarCarteiraBusca"]');
            if (inputBusca && inputBusca.parentElement) {
              const div = document.createElement('div');
              div.id = 'aviso-busca-jogos-colados';
              div.className = 'mt-2 p-3 bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl flex items-center justify-between gap-2 text-xs font-sans text-emerald-200 shadow-xl';
              div.innerHTML = `
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-lg">📥</span>
                  <span class="truncate">Identificamos <b>${res.jogos.length} jogos</b> colados aqui!</span>
                </div>
                <button type="button" onclick="salvarApostasDaBuscaRapida()" class="px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shrink-0 shadow active:scale-95 transition">
                  Salvar na Carteira
                </button>
              `;
              inputBusca.parentElement.appendChild(div);
            }
          }
          return;
        }
      }
    }
    if (avisoBox) avisoBox.remove();
    window.carteiraFiltros.busca = limpo.toLowerCase();
    window.atualizarPainelCarteira();
  };

  window.salvarApostasDaBuscaRapida = function () {
    const inputBusca = document.querySelector('input[oninput*="filtrarCarteiraBusca"]');
    const texto = inputBusca?.value || '';
    if (typeof window.salvarApostasNaCarteiraAPartirDeTexto === 'function') {
      window.salvarApostasNaCarteiraAPartirDeTexto(texto);
    } else if (typeof window.importarBilheteTexto === 'function') {
      const inputScanner = document.getElementById('textarea-scanner-lote') || document.getElementById('input-scanner-texto');
      if (inputScanner) inputScanner.value = texto;
      window.importarBilheteTexto();
    }
    if (inputBusca) inputBusca.value = '';
    window.carteiraFiltros.busca = '';
    const avisoBox = document.getElementById('aviso-busca-jogos-colados');
    if (avisoBox) avisoBox.remove();
    window.atualizarPainelCarteira();
  };

  window.alternarGrupoCarteira = function (grupoId) {
    window.carteiraFiltros.gruposAbertos[grupoId] = !window.carteiraFiltros.gruposAbertos[grupoId];
    if (typeof window.tocarBeep === 'function') window.tocarBeep('click');
    window.atualizarPainelCarteira();
  };

  window.alternarGavetaFerramentas = function () {
    const gaveta = document.getElementById('gaveta-ferramentas-carteira');
    const icone = document.getElementById('icone-gaveta-ferramentas');
    if (!gaveta) return;
    const fechado = gaveta.classList.contains('hidden');
    if (fechado) {
      gaveta.classList.remove('hidden');
      if (icone) icone.innerText = '▴';
    } else {
      gaveta.classList.add('hidden');
      if (icone) icone.innerText = '▾';
    }
  };

  function obterListaCarteira() {
    if (Array.isArray(window.carteiraJogos) && window.carteiraJogos.length > 0) {
      return window.carteiraJogos;
    }
    try {
      const bruto = localStorage.getItem('loterias_carteira_db');
      if (bruto) {
        const dados = JSON.parse(bruto);
        if (Array.isArray(dados) && dados.length > 0) {
          window.carteiraJogos = dados;
          return dados;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler carteira:', e);
    }
    return Array.isArray(window.carteiraJogos) ? window.carteiraJogos : [];
  }

  function agruparBilhetes(bilhetes) {
    const grupos = {};

    bilhetes.forEach((b) => {
      const mod = b.modalidade || 'megasena';
      const conc = b.concursoAlvo || b.concurso || 'Próximo';
      const data = b.data || 'Sem data';
      const grupoChave = `${mod}_${conc}_${data}`;

      if (!grupos[grupoChave]) {
        grupos[grupoChave] = {
          id: grupoChave,
          modalidade: mod,
          concurso: conc,
          data: data,
          bilhetes: [],
          totalCusto: 0,
          totalPremio: 0,
          premiadosCount: 0
        };
      }

      grupos[grupoChave].bilhetes.push(b);
      grupos[grupoChave].totalCusto += Number(b.custo || (mod === 'lotofacil' ? 3.0 : 5.0));
      const premio = Number(b.premioGanho || 0);
      grupos[grupoChave].totalPremio += premio;
      if (premio > 0) grupos[grupoChave].premiadosCount++;
    });

    return Object.values(grupos);
  }

  window.imprimirLoteGrupoCarteira = function (grupoId) {
    const bilhetes = obterListaCarteira();
    const grupos = agruparBilhetes(bilhetes);
    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo || !grupo.bilhetes.length) return;
    const jogos = grupo.bilhetes.map(b => b.dezenas);
    if (typeof window.imprimirJogosVolante === 'function') {
      window.imprimirJogosVolante(jogos, grupo.modalidade);
    }
  };

  window.compartilharWhatsAppGrupoCarteira = function (grupoId) {
    const bilhetes = obterListaCarteira();
    const grupos = agruparBilhetes(bilhetes);
    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo || !grupo.bilhetes.length) return;

    const modNome = grupo.modalidade === 'lotofacil' ? 'Lotofácil' : 'Mega-Sena';
    let msg = `🛰️ *Loterias NASA Pro — Lote de Apostas*\n`;
    msg += `Modalidade: *${modNome}*\n`;
    msg += `Concurso: *${grupo.concurso}* (${grupo.data})\n`;
    msg += `Total de Jogos: *${grupo.bilhetes.length}*\n\n`;

    grupo.bilhetes.forEach((b, idx) => {
      const dezenasFormatadas = b.dezenas.map(n => String(n).padStart(2, '0')).join(' - ');
      msg += `*Jogo #${idx + 1}:* ${dezenasFormatadas}\n`;
    });

    msg += `\n🛰️ *Loterias NASA Pro* — Monte e audite seus bolões:\n👉 https://loterias.pd.dev.br/`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  window.removerLoteGrupoCarteira = function (grupoId) {
    const bilhetes = obterListaCarteira();
    const grupos = agruparBilhetes(bilhetes);
    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo) return;

    if (typeof window.abrirModalDialog === 'function') {
      window.abrirModalDialog(`Excluir todas as ${grupo.bilhetes.length} apostas do ${grupo.concurso}?`, () => {
        const idsRemover = new Set(grupo.bilhetes.map(b => String(b.id)));
        window.carteiraJogos = window.carteiraJogos.filter(b => !idsRemover.has(String(b.id)));
        if (typeof window.salvarCarteiraStorage === 'function') window.salvarCarteiraStorage();
        window.atualizarPainelCarteira();
        if (typeof window.toast === 'function') window.toast('Lote removido da carteira.', '🗑️');
      });
    } else if (confirm(`Excluir as ${grupo.bilhetes.length} apostas?`)) {
      const idsRemover = new Set(grupo.bilhetes.map(b => String(b.id)));
      window.carteiraJogos = window.carteiraJogos.filter(b => !idsRemover.has(String(b.id)));
      if (typeof window.salvarCarteiraStorage === 'function') window.salvarCarteiraStorage();
      window.atualizarPainelCarteira();
    }
  };

  // Substitui a renderização padrão da carteira por uma interface de alta escalabilidade
  window.renderizarCarteiraInteligente = function () {
    const container = document.getElementById('container-bilhetes-salvos');
    if (!container) return;

    const listaOriginal = obterListaCarteira();
    const totalEl = document.getElementById('total-bilhetes-salvos');
    if (totalEl) totalEl.innerText = listaOriginal.length;

    // Métricas financeiras da banca
    let totalGasto = 0;
    let totalGanho = 0;
    listaOriginal.forEach(b => {
      const custoPadrao = b.modalidade === 'lotofacil' ? 3.0 : 5.0;
      totalGasto += Number(b.custo || custoPadrao);
      totalGanho += Number(b.premioGanho || 0);
    });

    const fmtBRL = typeof window.formatarReais === 'function' 
      ? window.formatarReais 
      : (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const invEl = document.getElementById('banca-investido');
    const premEl = document.getElementById('banca-premios');
    const lucroEl = document.getElementById('banca-lucro');
    if (invEl) invEl.innerText = fmtBRL(totalGasto);
    if (premEl) premEl.innerText = fmtBRL(totalGanho);
    const lucro = totalGanho - totalGasto;
    if (lucroEl) {
      lucroEl.innerText = fmtBRL(lucro);
      lucroEl.className = lucro >= 0 ? 'text-emerald-400 text-sm block mt-0.5 font-bold' : 'text-rose-400 text-sm block mt-0.5 font-bold';
    }

    if (typeof window.atualizarCalibracaoPortfolio === 'function') {
      try { window.atualizarCalibracaoPortfolio(); } catch (e) {}
    }

    // Filtragem em memória
    let filtrados = [...listaOriginal];

    if (window.carteiraFiltros.modalidade !== 'todas') {
      filtrados = filtrados.filter(b => (b.modalidade || 'megasena') === window.carteiraFiltros.modalidade);
    }

    if (window.carteiraFiltros.status === 'pendente') {
      filtrados = filtrados.filter(b => !b.conferido || Number(b.premioGanho || 0) === 0);
    } else if (window.carteiraFiltros.status === 'premiado') {
      filtrados = filtrados.filter(b => Number(b.premioGanho || 0) > 0);
    }

    if (window.carteiraFiltros.busca) {
      const q = window.carteiraFiltros.busca;
      filtrados = filtrados.filter(b => {
        const dezenasStr = (b.dezenas || []).join(' ');
        const concStr = String(b.concursoAlvo || b.concurso || '').toLowerCase();
        const nomeStr = String(b.nome || '').toLowerCase();
        return dezenasStr.includes(q) || concStr.includes(q) || nomeStr.includes(q);
      });
    }

    if (filtrados.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
          <span class="text-3xl block">💼</span>
          <p class="text-xs text-slate-400">Nenhum bilhete encontrado com os filtros selecionados.</p>
          ${listaOriginal.length > 0 ? `
            <button onclick="window.carteiraFiltros.modalidade='todas'; window.carteiraFiltros.status='todos'; window.carteiraFiltros.busca=''; window.atualizarPainelCarteira();" class="text-cyan-400 text-xs underline font-bold">
              Limpar Filtros (${listaOriginal.length} apostas salvas)
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    // MODO 1: AGRUPADO POR CONCURSO / DATA (IDEAL PARA DEZENAS DE APOSTAS)
    if (window.carteiraFiltros.modo === 'agrupado') {
      const grupos = agruparBilhetes(filtrados);

      container.innerHTML = grupos.map((g) => {
        const aberto = !!window.carteiraFiltros.gruposAbertos[g.id];
        const isMega = g.modalidade === 'megasena';
        const badgeCor = isMega 
          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
          : 'bg-purple-950 text-purple-400 border border-purple-800';
        const todosConferidos = g.bilhetes.every(b => b.conferido);
        const algumConferido = g.bilhetes.some(b => b.conferido);
        const ehPassado = g.data ? (typeof dataBRNoFuturo === 'function' ? !dataBRNoFuturo(g.data) : true) : false;

        let statusBadge = '';
        if (g.totalPremio > 0) {
          statusBadge = `<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">🏆 ${g.premiadosCount} Premiado(s) • ${fmtBRL(g.totalPremio)}</span>`;
        } else if (todosConferidos || algumConferido) {
          const totalAcertos = g.bilhetes.reduce((s, b) => s + (b.acertos || 0), 0);
          statusBadge = `<span class="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">Conferido • ${totalAcertos} acerto(s)</span>`;
        } else if (ehPassado) {
          statusBadge = `<button type="button" onclick="conferirTodosBilhetesSalvos()" class="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-black transition flex items-center gap-1 shadow">⚡ Sorteio Realizado • Conferir</button>`;
        } else {
          statusBadge = `<span class="px-2.5 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold">⏳ Aguardando Sorteio Oficial</span>`;
        }

        return `
          <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg transition">
            <!-- Cabeçalho do Concurso/Lote -->
            <div class="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/60 border-b border-slate-800/80">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${badgeCor}">
                  ${isMega ? '🍀 MEGA-SENA' : '🟣 LOTOFÁCIL'}
                </span>
                <span class="text-xs font-black text-white font-mono">
                  ${g.concurso.startsWith('#') ? g.concurso : `Conc. ${g.concurso}`}
                </span>
                <span class="text-[11px] text-slate-400 font-mono">📅 ${g.data}</span>
                <span class="text-[11px] font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/60">
                  ${g.bilhetes.length} aposta${g.bilhetes.length > 1 ? 's' : ''} (${fmtBRL(g.totalCusto)})
                </span>
              </div>

              <div class="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                ${statusBadge}
                <button type="button" onclick="alternarGrupoCarteira('${g.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1">
                  <span>${aberto ? 'Recolher' : 'Ver Jogos'}</span>
                  <span class="text-[10px]">${aberto ? '▴' : '▾'}</span>
                </button>
              </div>
            </div>

            <!-- Ações Rápidas do Lote -->
            <div class="px-3 py-1.5 bg-slate-950/90 border-b border-slate-900 flex justify-between items-center text-[11px]">
              <div class="flex gap-2">
                <button type="button" onclick="compartilharWhatsAppGrupoCarteira('${g.id}')" class="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                  <span>📱</span> WhatsApp do Lote
                </button>
                <span class="text-slate-700">•</span>
                <button type="button" onclick="imprimirLoteGrupoCarteira('${g.id}')" class="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1">
                  <span>🖨️</span> Imprimir Folha A4
                </button>
              </div>
              <button type="button" onclick="removerLoteGrupoCarteira('${g.id}')" class="text-rose-400 hover:text-rose-300 text-[10px] font-bold" title="Excluir este concurso">
                Excluir Lote
              </button>
            </div>

            <!-- Lista Expandida de Bilhetes deste Concurso -->
            ${aberto ? `
              <div class="p-2 sm:p-3 space-y-1.5 bg-slate-950/40">
                ${g.bilhetes.map((b, idx) => {
                  const dezenasSorteadas = (b.dezenasSorteadas || []).map(Number);
                  const foiConferido = Boolean(b.conferido || b.acertos !== undefined);
                  const acertos = b.acertos !== undefined ? b.acertos : (dezenasSorteadas.length > 0 ? (b.dezenas || []).filter(d => dezenasSorteadas.includes(Number(d))).length : null);
                  return `
                    <div class="p-2.5 bg-slate-900 rounded-xl border ${b.premioGanho > 0 ? 'border-emerald-500/80 bg-emerald-950/20' : 'border-slate-800/80'} flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div class="flex items-center gap-2">
                        <span class="font-black text-slate-500 font-mono text-[11px]">#${idx + 1}</span>
                        <div class="flex flex-wrap gap-1">
                          ${b.dezenas.map(d => {
                            const acertou = dezenasSorteadas.includes(Number(d));
                            return `<span class="w-6 h-6 rounded text-[9px] font-bold flex items-center justify-center font-mono transition ${
                              acertou
                                ? 'bg-emerald-500 text-slate-950 font-black scale-105 shadow-md shadow-emerald-500/40 border border-white'
                                : 'bg-slate-800 text-slate-200 border border-slate-700/60'
                            }">${String(d).padStart(2,'0')}</span>`;
                          }).join('')}
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        ${foiConferido && acertos !== null ? `
                          <span class="px-2 py-0.5 rounded-lg text-[10px] font-black ${
                            b.premioGanho > 0 
                              ? 'bg-emerald-500 text-slate-950 shadow' 
                              : acertos >= 4 
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' 
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }">
                            ${acertos} acerto(s)
                          </span>
                        ` : ''}
                        ${b.premioGanho > 0 ? `<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px]">+${fmtBRL(b.premioGanho)}</span>` : ''}
                        <button type="button" onclick="carregarBilheteNoVolante('${b.id}')" class="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold px-2 py-1 bg-slate-800 rounded-lg border border-slate-700" title="Ver no volante">
                          🎯 Volante
                        </button>
                        <button type="button" onclick="removerBilheteCarteira('${b.id}')" class="text-rose-400 hover:text-rose-300 text-xs p-1" title="Excluir bilhete individual">
                          ✕
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
      return;
    }

    // MODO 2: LISTA PLANA INDIVIDUAL
    container.innerHTML = filtrados.map((b, idx) => {
      const isMega = (b.modalidade || 'megasena') === 'megasena';
      return `
        <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <span class="px-1.5 py-0.5 rounded font-black text-[9px] ${isMega ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-purple-950 text-purple-400 border border-purple-800'}">${(b.modalidade || 'megasena').toUpperCase()}</span>
                <span class="text-cyan-300 text-[10px] font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">📅 ${b.data || 'Oficial'}</span>
                ${b.concursoAlvo ? `<span class="text-slate-300 text-[10px] font-bold font-mono">${b.concursoAlvo}</span>` : ''}
                ${b.premioGanho > 0 ? `<span class="text-emerald-400 font-bold text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">+${fmtBRL(b.premioGanho)}</span>` : '<span class="text-slate-500 text-[9px]">Aguardando</span>'}
              </div>
              <div class="flex flex-wrap gap-1">
                ${b.dezenas.map(d => `<span class="w-5 h-5 rounded text-[9px] font-bold bg-slate-800 text-slate-200 flex items-center justify-center">${String(d).padStart(2,'0')}</span>`).join('')}
              </div>
            </div>
            <div class="flex items-center gap-1.5 self-end sm:self-center">
              <button type="button" onclick="carregarBilheteNoVolante('${b.id}')" class="text-emerald-400 hover:text-emerald-300 text-[10px] px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 font-bold flex items-center gap-1">
                <span>🎯</span> Volante
              </button>
              <button type="button" onclick="removerBilheteCarteira('${b.id}')" class="text-rose-400 hover:text-rose-300 text-sm p-1" title="Remover bilhete">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  // Garante a substituição suave da função de renderização
  window.atualizarPainelCarteira = function () {
    window.renderizarCarteiraInteligente();
  };
})();
