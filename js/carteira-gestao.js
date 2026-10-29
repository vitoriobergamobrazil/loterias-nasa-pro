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
    tempo: 'todos',      // 'todos', 'proximo', 'historico'
    busca: '',
    gruposAbertos: {}
  };

  window.concursoOuDataEhPassado = function (concurso, data, modalidade) {
    const mod = modalidade || 'megasena';
    const base = mod === 'megasena' ? (window.baseConcursosMega || []) : (window.baseConcursosLoto || []);
    const numConc = concurso ? Number(String(concurso).replace(/\D/g, '')) : null;
    
    // 1. Se concurso existe na base ou é menor/igual ao último apurado conhecido
    if (numConc && base.length > 0) {
      const ultimo = Number(base[0].concurso);
      if (numConc <= ultimo || base.some(c => Number(c.concurso) === numConc)) {
        return true;
      }
    }

    // 2. Se a data é passada (antes de agora ou passou das 20h)
    if (data) {
      const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(data).trim());
      if (partes) {
        const [, dia, mes, ano] = partes;
        const alvo = new Date(Number(ano), Number(mes) - 1, Number(dia), 20, 0, 0);
        return alvo.getTime() <= Date.now();
      }
    }
    return false;
  };

  window.setFiltroTempoCarteira = function (tempo) {
    window.carteiraFiltros.tempo = tempo;
    ['todos', 'proximo', 'historico'].forEach(t => {
      const btn = document.getElementById(`btn-filtro-tempo-${t}`);
      if (btn) {
        if (t === tempo) {
          btn.className = 'px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700 transition font-bold';
        } else {
          btn.className = 'px-2 py-0.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition font-medium';
        }
      }
    });
    if (typeof window.tocarBeep === 'function') window.tocarBeep('click');
    window.atualizarPainelCarteira();
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
          premiadosCount: 0,
          dezenasSorteadas: null
        };
      }

      grupos[grupoChave].bilhetes.push(b);
      grupos[grupoChave].totalCusto += Number(b.custo || (mod === 'lotofacil' ? 3.0 : 5.0));
      const premio = Number(b.premioGanho || 0);
      grupos[grupoChave].totalPremio += premio;
      if (premio > 0) grupos[grupoChave].premiadosCount++;

      // Identifica o resultado oficial do concurso para exibir no bilhete
      if (!grupos[grupoChave].dezenasSorteadas) {
        if (Array.isArray(b.dezenasSorteadas) && b.dezenasSorteadas.length > 0) {
          grupos[grupoChave].dezenasSorteadas = b.dezenasSorteadas.map(Number);
        } else {
          const numConc = Number(String(conc).replace(/\D/g, ''));
          const base = mod === 'megasena' ? (window.baseConcursosMega || []) : (window.baseConcursosLoto || []);
          if (numConc > 0) {
            const enc = base.find(c => Number(c.concurso) === numConc);
            if (enc && Array.isArray(enc.dezenas) && enc.dezenas.length > 0) {
              grupos[grupoChave].dezenasSorteadas = enc.dezenas.map(Number);
              if (enc.data && (!grupos[grupoChave].data || grupos[grupoChave].data === 'Sem data' || grupos[grupoChave].data.includes('undefined'))) {
                grupos[grupoChave].data = enc.data;
              }
            }
          }
        }
      }
    });

    Object.values(grupos).forEach(g => {
      if (g.dezenasSorteadas && g.dezenasSorteadas.length > 0) {
        g.bilhetes.forEach(b => {
          if (!b.conferido || b.acertos === undefined) {
            const ac = (b.dezenas || []).filter(d => g.dezenasSorteadas.includes(Number(d))).length;
            b.acertos = ac;
            b.conferido = true;
            b.dezenasSorteadas = g.dezenasSorteadas;
          }
        });
      }
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

  window.reatribuirConcursoLote = function (grupoId, concursoAlvoDesejado) {
    const bilhetes = obterListaCarteira();
    const grupos = agruparBilhetes(bilhetes);
    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo) return;

    const base = grupo.modalidade === 'megasena' ? (window.baseConcursosMega || []) : (window.baseConcursosLoto || []);
    let concursoDestino = concursoAlvoDesejado;

    if (!concursoDestino) {
      const ultimosConc = base.slice(0, 4).map(c => `#${c.concurso}`);
      const sugestao = ultimosConc[0] || '#3077';
      const digitado = prompt(
        `Para qual concurso você deseja mover esta(s) ${grupo.bilhetes.length} aposta(s)?\nSugestões: ${ultimosConc.join(', ')}`,
        sugestao
      );
      if (!digitado || !digitado.trim()) return;
      concursoDestino = digitado.trim();
    }

    const concFormatado = concursoDestino.startsWith('#') ? concursoDestino : `#${concursoDestino}`;
    const numConc = Number(concFormatado.replace(/\D/g, ''));
    const achado = base.find(c => Number(c.concurso) === numConc);
    const novaData = achado?.data || grupo.data;

    const idsGrupo = new Set(grupo.bilhetes.map(b => String(b.id)));
    (window.carteiraJogos || []).forEach(b => {
      if (idsGrupo.has(String(b.id))) {
        b.concursoAlvo = concFormatado;
        b.concurso = concFormatado;
        if (novaData) b.data = novaData;
        b.conferido = false;
        b.status = 'Aguardando conferência';
        b.premioGanho = 0;
        b.acertos = undefined;
      }
    });

    if (typeof window.salvarCarteiraStorage === 'function') window.salvarCarteiraStorage();
    window.atualizarPainelCarteira();

    if (typeof window.conferirSorteiosPassadosAutomatico === 'function') {
      window.conferirSorteiosPassadosAutomatico();
    }

    if (typeof window.toast === 'function') {
      window.toast(`Aposta(s) movida(s) para o Concurso ${concFormatado}!`, '✅');
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

    if (window.carteiraFiltros.tempo === 'proximo') {
      filtrados = filtrados.filter(b => !window.concursoOuDataEhPassado(b.concursoAlvo || b.concurso, b.data, b.modalidade));
    } else if (window.carteiraFiltros.tempo === 'historico') {
      filtrados = filtrados.filter(b => window.concursoOuDataEhPassado(b.concursoAlvo || b.concurso, b.data, b.modalidade));
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

    // Atualiza status do botão principal de conferência no topo
    const btnConferir = document.getElementById('btn-conferir-carteira-topo') || document.querySelector('button[onclick*="conferirTodosBilhetesSalvos"]');
    if (btnConferir) {
      if (listaOriginal.length === 0) {
        btnConferir.className = 'px-3 py-1.5 bg-slate-800 text-slate-400 border border-slate-700 font-bold text-xs rounded-xl shadow cursor-not-allowed opacity-60';
        btnConferir.innerHTML = '<span>⚡</span> <span>CONFERIR TUDO</span>';
      } else {
        const todosConferidos = listaOriginal.every(b => b.conferido);
        const temPendentesPassados = listaOriginal.some(b => !b.conferido && window.concursoOuDataEhPassado(b.concursoAlvo || b.concurso, b.data, b.modalidade));
        if (todosConferidos) {
          btnConferir.className = 'px-3 py-1.5 bg-slate-900 text-emerald-400 border border-emerald-500/40 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5';
          btnConferir.innerHTML = '<span>✓</span> <span>CONFERIDO</span>';
        } else if (temPendentesPassados) {
          btnConferir.className = 'px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 active:scale-95 transition flex items-center gap-1.5 animate-pulse';
          btnConferir.innerHTML = '<span>⚡</span> <span>CONFERIR AGORA</span>';
        } else {
          btnConferir.className = 'px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow active:scale-95 transition flex items-center gap-1.5';
          btnConferir.innerHTML = '<span>⚡</span> <span>CONFERIR TUDO</span>';
        }
      }
    }

    if (filtrados.length === 0) {
      if (listaOriginal.length === 0) {
        container.innerHTML = `
          <div class="py-12 px-4 text-center space-y-4 bg-slate-950/80 rounded-3xl border border-dashed border-slate-800 shadow-xl">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-950 via-slate-900 to-emerald-950 border border-cyan-800/60 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/10">
              🎟️
            </div>
            <div class="space-y-1">
              <h4 class="text-sm font-black text-white">Sua carteira está pronta</h4>
              <p class="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Você ainda não tem apostas registradas. Gere jogos calibrados pelo motor orbital ou cole palpites de grupos.
              </p>
            </div>
            <div class="flex flex-wrap justify-center gap-2 pt-2">
              <button type="button" onclick="mudarAba('gerador')" class="px-4 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center gap-1.5 font-mono">
                <span>⚡</span> GERAR NO RADAR
              </button>
              <button type="button" onclick="alternarSubAbaCarteira('ferramentas')" class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs rounded-xl border border-slate-700 active:scale-95 transition flex items-center gap-1.5">
                <span>📥</span> Colar Apostas
              </button>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
            <span class="text-3xl block">🔍</span>
            <p class="text-xs text-slate-400">Nenhum bilhete encontrado com os filtros selecionados.</p>
            <button onclick="window.carteiraFiltros.modalidade='todas'; window.carteiraFiltros.status='todos'; window.carteiraFiltros.busca=''; window.atualizarPainelCarteira();" class="text-cyan-400 text-xs underline font-bold">
              Limpar Filtros (${listaOriginal.length} apostas salvas)
            </button>
          </div>
        `;
      }
      return;
    }

    // MODO 1: AGRUPADO POR CONCURSO / DATA (PADRÃO FINTECH PREMIUM 10/10)
    if (window.carteiraFiltros.modo === 'agrupado') {
      const grupos = agruparBilhetes(filtrados);

      container.innerHTML = grupos.map((g) => {
        const aberto = !!window.carteiraFiltros.gruposAbertos[g.id];
        const isMega = g.modalidade === 'megasena';
        const todosConferidos = g.bilhetes.every(b => b.conferido);
        const algumConferido = g.bilhetes.some(b => b.conferido);
        const ehPassado = window.concursoOuDataEhPassado(g.concurso, g.data, g.modalidade);

        let statusBadge = '';
        if (g.totalPremio > 0) {
          statusBadge = `<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">🏆 ${g.premiadosCount} Premiado(s) • ${fmtBRL(g.totalPremio)}</span>`;
        } else if (todosConferidos || algumConferido) {
          const maxAcertos = Math.max(0, ...g.bilhetes.map(b => b.acertos || 0));
          const rotulo = maxAcertos > 0 ? `${maxAcertos} acerto${maxAcertos > 1 ? 's' : ''}` : '0 acertos';
          statusBadge = `<span class="px-2.5 py-1 rounded-full bg-slate-800/90 text-emerald-300 border border-slate-700 text-[10px] font-bold">✅ Apurado • ${rotulo}</span>`;
        } else if (ehPassado) {
          statusBadge = `<button type="button" onclick="event.stopPropagation(); conferirTodosBilhetesSalvos()" class="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-black transition flex items-center gap-1 shadow">⚡ Concurso Apurado • Conferir</button>`;
        } else {
          const modBase = g.modalidade === 'megasena' ? (window.baseConcursosMega || []) : (window.baseConcursosLoto || []);
          const ultimoNum = modBase.length > 0 ? `#${modBase[0].concurso}` : '#3077';
          statusBadge = `
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-2.5 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-medium">⏳ Aguardando Sorteio</span>
              <button type="button" onclick="event.stopPropagation(); window.reatribuirConcursoLote('${g.id}', '${ultimoNum}')" class="px-2 py-0.5 rounded-full bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-[10px] font-bold transition flex items-center gap-1 shadow active:scale-95" title="Se você jogou este bilhete no concurso anterior, toque para conferir">
                <span>⚡</span> Conferir com ${ultimoNum}
              </button>
            </div>
          `;
        }

        return `
          <div class="bg-slate-950 rounded-2xl border border-slate-800/90 hover:border-slate-700/80 overflow-hidden shadow-xl transition">
            <!-- Barra Colorida de Topo (Identidade da Modalidade) -->
            <div class="h-1 bg-gradient-to-r ${isMega ? 'from-emerald-500 via-teal-400 to-cyan-500' : 'from-purple-500 via-fuchsia-400 to-pink-500'}"></div>

            <!-- Cabeçalho do Concurso (Estilo Bilhete Oficial Coeso) -->
            <div class="p-3 sm:p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-dashed border-slate-800/90 cursor-pointer select-none" onclick="alternarGrupoCarteira('${g.id}')">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl ${isMega ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'} border flex items-center justify-center text-base flex-shrink-0">
                  ${isMega ? '🍀' : '🟣'}
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="text-xs sm:text-sm font-black text-white font-mono whitespace-nowrap">
                      ${isMega ? 'Mega-Sena' : 'Lotofácil'} ${g.concurso.startsWith('#') ? g.concurso : `#${g.concurso}`}
                    </h4>
                    <span class="text-[10px] text-cyan-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap">📅 ${g.data}</span>
                  </div>
                  <p class="text-[11px] text-slate-400 font-sans mt-0.5">
                    ${g.bilhetes.length} aposta${g.bilhetes.length > 1 ? 's' : ''} • <strong class="text-slate-300 font-mono">${fmtBRL(g.totalCusto)}</strong>
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 justify-between sm:justify-end flex-wrap">
                ${statusBadge}
                <button type="button" class="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs transition border border-slate-700" title="${aberto ? 'Recolher' : 'Ver Jogos'}">
                  ${aberto ? '▴' : '▾'}
                </button>
              </div>
            </div>

            <!-- Faixa do Resultado Oficial da Caixa (Quando Sorteado) -->
            ${aberto && g.dezenasSorteadas && g.dezenasSorteadas.length > 0 ? `
              <div class="px-3 py-2 bg-emerald-950/25 border-b border-emerald-900/40 flex items-center justify-between gap-2 flex-wrap">
                <span class="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🎯</span> Sorteio Oficial Caixa:
                </span>
                <div class="flex items-center gap-1 flex-wrap">
                  ${g.dezenasSorteadas.map(d => `<span class="w-6 h-6 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px] font-mono flex items-center justify-center border border-white shadow-sm">${String(d).padStart(2,'0')}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Lista de Bilhetes do Concurso -->
            ${aberto ? `
              <div class="p-2 sm:p-3 space-y-1.5 bg-slate-950/60 divide-y divide-slate-900">
                ${g.bilhetes.map((b, idx) => {
                  const dezenasSorteadas = (b.dezenasSorteadas || g.dezenasSorteadas || []).map(Number);
                  const foiConferido = Boolean(b.conferido || b.acertos !== undefined);
                  const acertos = b.acertos !== undefined ? b.acertos : (dezenasSorteadas.length > 0 ? (b.dezenas || []).filter(d => dezenasSorteadas.includes(Number(d))).length : null);
                  const acertouAlgum = (acertos || 0) > 0;
                  const isLoto = (b.dezenas || []).length > 10;
                  return `
                    <div class="py-2.5 px-2.5 sm:px-3 rounded-xl flex items-center justify-between gap-2 text-xs transition ${b.premioGanho > 0 ? 'bg-emerald-950/20 border border-emerald-500/40' : 'hover:bg-slate-900/60'}">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="font-mono font-bold text-slate-500 text-[10px] w-4 flex-shrink-0">#${idx + 1}</span>
                        <div class="${isLoto ? 'grid grid-cols-5 sm:grid-cols-8 gap-1 items-center' : 'flex flex-wrap gap-1 sm:gap-1.5 items-center'}">
                          ${b.dezenas.map(d => {
                            const acertou = dezenasSorteadas.includes(Number(d));
                            return `<span class="${isLoto ? 'w-5 h-5 sm:w-6 sm:h-6 text-[9px] sm:text-[10px]' : 'w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-xs'} rounded-lg font-mono font-bold flex items-center justify-center transition ${
                              acertou
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/50 scale-105 border border-white ring-1 ring-emerald-300'
                                : 'bg-slate-800 text-slate-200 border border-slate-700/80'
                            }">${String(d).padStart(2,'0')}</span>`;
                          }).join('')}
                        </div>
                      </div>

                      <div class="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 font-mono">
                        ${b.premioGanho > 0 ? `
                          <span class="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px] shadow">
                            🏆 ${fmtBRL(b.premioGanho)}
                          </span>
                        ` : foiConferido && acertos !== null ? `
                          <span class="text-[11px] font-bold ${acertouAlgum ? 'text-emerald-400 font-black' : 'text-slate-500'}">
                            ${acertos} ${acertos === 1 ? 'acerto' : 'acertos'}
                          </span>
                        ` : `
                          <span class="text-[10px] text-slate-500">Pendente</span>
                        `}
                        <button type="button" onclick="event.stopPropagation(); removerBilheteCarteira('${b.id}')" class="w-6 h-6 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 flex items-center justify-center text-xs transition" title="Excluir este jogo">
                          ✕
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Rodapé de Ações do Bilhete (Discreto e Elegante) -->
              <div class="px-3.5 py-2 bg-slate-900/40 border-t border-slate-900 flex justify-between items-center text-[11px] text-slate-400 font-sans flex-wrap gap-2">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <button type="button" onclick="compartilharWhatsAppGrupoCarteira('${g.id}')" class="hover:text-emerald-300 font-bold transition flex items-center gap-1">
                    <span>📱</span> WhatsApp
                  </button>
                  <span class="text-slate-800">•</span>
                  <button type="button" onclick="imprimirLoteGrupoCarteira('${g.id}')" class="hover:text-amber-300 font-bold transition flex items-center gap-1">
                    <span>🖨️</span> Imprimir A4
                  </button>
                  <span class="text-slate-800">•</span>
                  <button type="button" onclick="reatribuirConcursoLote('${g.id}')" class="hover:text-cyan-300 font-bold transition flex items-center gap-1" title="Corrigir o número do concurso deste lote">
                    <span>✏️</span> Mudar Concurso
                  </button>
                </div>
                <button type="button" onclick="removerLoteGrupoCarteira('${g.id}')" class="text-slate-500 hover:text-rose-400 text-[10px] font-bold transition">
                  Excluir lote
                </button>
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
      const dezenasSorteadas = (b.dezenasSorteadas || []).map(Number);
      const foiConferido = Boolean(b.conferido || b.acertos !== undefined);
      const acertos = b.acertos !== undefined ? b.acertos : (dezenasSorteadas.length > 0 ? (b.dezenas || []).filter(d => dezenasSorteadas.includes(Number(d))).length : null);
      return `
        <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800/90 shadow-md flex items-center justify-between gap-2 text-xs font-mono">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-1.5 py-0.5 rounded text-[9px] font-black ${isMega ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-purple-950 text-purple-400 border border-purple-800'}">${(b.modalidade || 'megasena').toUpperCase()}</span>
              ${b.concursoAlvo ? `<span class="text-white text-[10px] font-bold">${b.concursoAlvo}</span>` : ''}
              <span class="text-slate-400 text-[10px]">📅 ${b.data || 'Oficial'}</span>
              ${b.premioGanho > 0 ? `<span class="text-emerald-400 font-black text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">🏆 +${fmtBRL(b.premioGanho)}</span>` : foiConferido ? `<span class="text-slate-400 text-[10px]">${acertos || 0} acertos</span>` : '<span class="text-slate-500 text-[9px]">Pendente</span>'}
            </div>
            <div class="flex flex-wrap gap-1">
              ${b.dezenas.map(d => {
                const acertou = dezenasSorteadas.includes(Number(d));
                return `<span class="w-6 h-6 rounded text-[9px] font-bold flex items-center justify-center ${
                  acertou ? 'bg-emerald-500 text-slate-950 font-black scale-105 border border-white' : 'bg-slate-800 text-slate-200'
                }">${String(d).padStart(2,'0')}</span>`;
              }).join('')}
            </div>
          </div>
          <button type="button" onclick="removerBilheteCarteira('${b.id}')" class="w-7 h-7 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 flex items-center justify-center text-xs transition flex-shrink-0" title="Remover aposta">
            🗑️
          </button>
        </div>
      `;
    }).join('');
  };

  // Garante a substituição suave da função de renderização
  window.atualizarPainelCarteira = function () {
    window.renderizarCarteiraInteligente();
  };
})();
