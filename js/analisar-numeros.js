// ===================================================================
// CAMINHO A — "Já tenho meus números"
// ===================================================================
// Porta de entrada para quem já escolheu os números e só quer saber se
// "tem ciência por trás", sem gerar nem salvar nada na carteira.
//
// Reaproveita o mesmo parsing de texto já usado em importarBilheteTexto()
// (index.html) — só que aqui os números NUNCA tocam em carteiraJogos nem
// em rede: caem direto no pipeline de análise que já existe
// (setJogoAtual → executarAnaliseDinamicaDoJogo → gate científico), o
// mesmo caminho que um jogo gerado percorre. Isso torna a promessa "seus
// números não saem deste navegador" verdadeira por construção, não por
// política declarada — não há nenhuma chamada de rede neste arquivo.

function abrirModalAnalisarNumeros() {
  if (document.getElementById('modal-analisar-numeros')) {
    document.getElementById('modal-analisar-numeros').classList.remove('hidden');
    document.getElementById('input-analisar-numeros')?.focus();
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'modal-analisar-numeros';
  modal.className = 'fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto';
  modal.innerHTML = `
    <div class="bg-slate-900 border border-cyan-800/60 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl relative font-sans">
      <button type="button" onclick="fecharModalAnalisarNumeros()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition">✕</button>

      <div class="text-center space-y-1.5 pt-1">
        <div class="text-3xl">🔬</div>
        <h2 class="text-lg font-black text-white">Já Tenho Meus Números</h2>
        <p class="text-xs text-slate-300 leading-relaxed">
          Cole ou digite as dezenas que você já escolheu. A gente roda a
          análise estatística nível NASA na hora.
        </p>
      </div>

      <div class="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 text-[11px] text-emerald-300 text-center">
        🔒 Seus números não são salvos nem enviados a lugar nenhum — a
        análise roda aqui, no seu navegador.
      </div>

      <div>
        <label for="input-analisar-numeros" class="text-xs uppercase font-bold text-slate-400 block mb-1.5">
          Números (separados por espaço, vírgula ou linha)
        </label>
        <textarea id="input-analisar-numeros" rows="3" placeholder="Ex: 04 12 23 31 45 58"
                  class="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-sm"></textarea>
        <p id="analisar-numeros-contagem" class="text-[11px] text-slate-500 mt-1.5">
          Digite 6 dezenas (Mega-Sena) ou 15 (Lotofácil).
        </p>
      </div>

      <button type="button" id="btn-analisar-numeros-confirmar"
              class="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2">
        <span>🔬</span> Analisar Meus Números
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  const textarea = document.getElementById('input-analisar-numeros');
  const contagem = document.getElementById('analisar-numeros-contagem');

  textarea.addEventListener('input', () => {
    const dezenas = extrairDezenasDoTexto(textarea.value);
    if (dezenas.length === 0) {
      contagem.innerText = 'Digite 6 dezenas (Mega-Sena) ou 15 (Lotofácil).';
      contagem.className = 'text-[11px] text-slate-500 mt-1.5';
    } else {
      const valido = dezenas.length === 6 || dezenas.length === 15;
      contagem.innerText = `${dezenas.length} dezena${dezenas.length > 1 ? 's' : ''} reconhecida${dezenas.length > 1 ? 's' : ''}${valido ? ' ✓' : ' — precisa ser 6 ou 15'}`;
      contagem.className = valido
        ? 'text-[11px] text-emerald-400 mt-1.5 font-bold'
        : 'text-[11px] text-amber-400 mt-1.5';
    }
  });

  document
    .getElementById('btn-analisar-numeros-confirmar')
    .addEventListener('click', confirmarAnaliseDeNumeros);

  textarea.focus();
}

function fecharModalAnalisarNumeros() {
  document.getElementById('modal-analisar-numeros')?.remove();
}

/** Mesma regra de importarBilheteTexto(): números 1-60, únicos, em ordem. */
function extrairDezenasDoTexto(texto) {
  const nums = String(texto || '').match(/\d+/g);
  if (!nums) return [];
  return Array.from(new Set(nums.map(Number)))
    .filter((n) => n >= 1 && n <= 60)
    .sort((a, b) => a - b);
}

function confirmarAnaliseDeNumeros() {
  const textarea = document.getElementById('input-analisar-numeros');
  const dezenas = extrairDezenasDoTexto(textarea?.value);

  if (dezenas.length !== 6 && dezenas.length !== 15) {
    toast('Digite exatamente 6 dezenas (Mega-Sena) ou 15 (Lotofácil).', '⚠️');
    tocarBeep('alert');
    return;
  }

  const modalidade = dezenas.length === 15 ? 'lotofacil' : 'megasena';
  if (typeof modalidadeAtual !== 'undefined' && modalidadeAtual !== modalidade && typeof trocarModalidade === 'function') {
    trocarModalidade(modalidade);
  }

  setJogoAtual([...dezenas]);
  fecharModalAnalisarNumeros();

  if (typeof activateTab === 'function') activateTab('gerar');

  // Pequeno atraso: activateTab troca a view no DOM; renderizar antes disso
  // pintaria em elementos que acabaram de ficar ocultos/trocados.
  setTimeout(() => {
    if (typeof renderizarVolante === 'function') renderizarVolante();
    if (typeof atualizarDisplayJogo === 'function') atualizarDisplayJogo();
    if (typeof executarAnaliseDinamicaDoJogo === 'function') executarAnaliseDinamicaDoJogo();
    if (typeof executarAnaliseVitorio === 'function') executarAnaliseVitorio();
    tocarSomNasa('sucesso');
  }, 50);
}

console.log('🔬 Analisar meus números carregado');
