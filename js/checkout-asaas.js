// ===================================================================
// CHECKOUT - cobrança real via Asaas
// ===================================================================
// Substitui as telas que mostravam "[QR Code PIX] Simulado para teste" e um
// código copia-e-cola inventado, com um botão "Confirmei o Pagamento" que não
// confirmava nada.
//
// Fluxo: coleta CPF -> criar-cobranca (servidor) -> página de pagamento do
// Asaas -> webhook confirma -> assinatura.js libera o PRO.
//
// O pagamento acontece na página hospedada do Asaas, não aqui. Assim o app
// nunca toca em número de cartão e fica fora do escopo de PCI.

const CHECKOUT_PLANOS = {
  avulso: { nome: 'Análise Avulsa', preco: 'R$ 4,90', periodo: 'pagamento único' },
  mensal: { nome: 'PRO Mensal', preco: 'R$ 29,90', periodo: 'por mês' },
  anual: { nome: 'PRO Anual', preco: 'R$ 197', periodo: 'por ano · equivale a R$ 16,41/mês' }
};

/** Valida CPF pelos dígitos verificadores, para não criar cliente inválido no gateway. */
function cpfValido(entrada) {
  const cpf = String(entrada || '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (ateIndice) => {
    let soma = 0;
    for (let i = 0; i < ateIndice; i++) {
      soma += Number(cpf[i]) * (ateIndice + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

function formatarCPF(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

async function obterSessaoSupabase() {
  const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;
  if (!cliente) return null;

  const { data } = await cliente.auth.getSession();
  return data?.session ?? null;
}

function mostrarCheckoutReal(planId) {
  const plano = CHECKOUT_PLANOS[planId];
  if (!plano) return;

  tocarSomNasa('purchase');

  const modal = document.getElementById('modal-upgrade-nasa');
  const content = modal?.querySelector('.modal-upgrade-content');
  if (!content) return;

  const nomeSugerido = (typeof usuarioSessao !== 'undefined' && usuarioSessao?.nome) || '';

  content.innerHTML = `
    <button id="btn-close-upgrade-modal" class="modal-upgrade-close" title="Fechar">✕</button>

    <div class="modal-upgrade-checkout">
      <div class="modal-upgrade-checkout-header">
        <h3>${plano.nome}</h3>
        <p>${plano.preco} • ${plano.periodo}</p>
      </div>

      <div style="background: rgba(51,65,85,.5); border: 1px solid rgb(71,85,105); border-radius: .75rem; padding: 1rem; margin: 1.25rem 0;">
        <label for="checkout-nome" style="display:block; font-size:.75rem; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; font-weight:700; margin-bottom:.4rem;">Nome completo</label>
        <input id="checkout-nome" type="text" value="${nomeSugerido}" maxlength="120" placeholder="Como está no documento"
               style="width:100%; padding:.75rem; background:rgb(15,23,42); border:1px solid rgb(71,85,105); border-radius:.5rem; color:white; outline:none; font-size:1rem;" />

        <label for="checkout-cpf" style="display:block; font-size:.75rem; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; font-weight:700; margin:1rem 0 .4rem;">CPF</label>
        <input id="checkout-cpf" type="text" inputmode="numeric" maxlength="14" placeholder="000.000.000-00"
               style="width:100%; padding:.75rem; background:rgb(15,23,42); border:1px solid rgb(71,85,105); border-radius:.5rem; color:white; outline:none; font-size:1rem;" />
        <p style="font-size:.75rem; color:#64748b; margin:.5rem 0 0;">
          Exigido pelo Asaas para emitir a cobrança. Não fica salvo no aplicativo.
        </p>
      </div>

      <div style="background: rgba(6,182,212,.1); border:1px solid rgb(34,211,238); border-radius:.75rem; padding:.9rem; font-size:.8rem; color:#7dd3fc;">
        Você será levado à página segura do Asaas, onde escolhe pagar por
        <strong>PIX</strong> ou <strong>cartão</strong>.
      </div>

      <div id="checkout-erro" style="display:none; background:rgba(248,113,113,.1); border:1px solid rgba(248,113,113,.4); border-radius:.75rem; padding:.9rem; margin-top:1rem; font-size:.85rem; color:#fca5a5;"></div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:.75rem; margin-top:1.5rem;">
        <button type="button" onclick="fecharModalUpgrade(); tocarBeep('click');"
                style="padding:.85rem; background:rgb(71,85,105); color:white; border:none; border-radius:.75rem; cursor:pointer; font-size:1rem;">
          Voltar
        </button>
        <button type="button" id="checkout-continuar"
                style="padding:.85rem; background:linear-gradient(135deg, rgb(34,197,94), rgb(6,182,212)); color:rgb(15,23,42); border:none; border-radius:.75rem; font-weight:700; cursor:pointer; font-size:1rem;">
          Ir para o pagamento
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-upgrade-modal')?.addEventListener('click', fecharModalUpgrade);

  const campoCpf = document.getElementById('checkout-cpf');
  campoCpf?.addEventListener('input', (evento) => {
    evento.target.value = formatarCPF(evento.target.value);
  });

  document
    .getElementById('checkout-continuar')
    ?.addEventListener('click', () => iniciarPagamento(planId));
}

function mostrarErroCheckout(mensagem) {
  const caixa = document.getElementById('checkout-erro');
  if (!caixa) return;
  caixa.textContent = mensagem;
  caixa.style.display = 'block';
}

async function iniciarPagamento(planId) {
  const botao = document.getElementById('checkout-continuar');
  const nome = document.getElementById('checkout-nome')?.value.trim();
  const cpf = document.getElementById('checkout-cpf')?.value.trim();

  if (!nome || nome.length < 3) {
    mostrarErroCheckout('Informe seu nome completo.');
    return;
  }

  if (!cpfValido(cpf)) {
    mostrarErroCheckout('CPF inválido. Confira os números.');
    return;
  }

  // A cobrança precisa de dono: é a sessão que amarra o pagamento ao usuário
  // e permite ao webhook liberar o acesso depois.
  const sessao = await obterSessaoSupabase();
  if (!sessao) {
    mostrarErroCheckout(
      'Entre com e-mail e senha antes de assinar — é assim que seu acesso ' +
      'fica vinculado ao pagamento.'
    );
    setTimeout(() => {
      fecharModalUpgrade();
      if (typeof abrirModalAuth === 'function') abrirModalAuth();
    }, 2200);
    return;
  }

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Gerando cobrança...';
  }

  try {
    const base = window.NASA_SUPABASE_CONFIG?.url;
    const resposta = await fetch(`${base}/functions/v1/criar-cobranca`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessao.access_token}`
      },
      body: JSON.stringify({
        plano: planId,
        metodo: 'UNDEFINED',
        documento: cpf.replace(/\D/g, ''),
        nome
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok || dados.erro) {
      throw new Error(dados.erro || 'não foi possível gerar a cobrança');
    }

    if (!dados.urlPagamento) {
      throw new Error('cobrança criada, mas sem link de pagamento');
    }

    window.open(dados.urlPagamento, '_blank', 'noopener');
    mostrarAguardandoPagamento(dados);
  } catch (err) {
    console.error('Falha no checkout:', err);
    mostrarErroCheckout(`Não foi possível continuar: ${err.message}`);
    if (botao) {
      botao.disabled = false;
      botao.textContent = 'Ir para o pagamento';
    }
  }
}

function mostrarAguardandoPagamento(cobranca) {
  const modal = document.getElementById('modal-upgrade-nasa');
  const content = modal?.querySelector('.modal-upgrade-content');
  if (!content) return;

  content.innerHTML = `
    <button id="btn-close-upgrade-modal" class="modal-upgrade-close" title="Fechar">✕</button>

    <div class="modal-upgrade-checkout" style="text-align:center;">
      <div style="font-size:3rem; margin:1rem 0;">⏳</div>
      <h3 style="color:white; margin:0 0 .5rem;">Aguardando o pagamento</h3>
      <p style="color:#cbd5e1; font-size:.9rem; margin:0 0 1.5rem;">
        Abrimos a página do Asaas em outra aba. Assim que o pagamento for
        confirmado, seu acesso é liberado automaticamente aqui.
      </p>

      <div style="background:rgba(51,65,85,.5); border:1px solid rgb(71,85,105); border-radius:.75rem; padding:1rem; text-align:left; font-size:.85rem; color:#cbd5e1;">
        <p style="margin:0 0 .5rem;"><strong>PIX:</strong> confirma em segundos.</p>
        <p style="margin:0;"><strong>Cartão:</strong> pode levar alguns minutos se passar por análise.</p>
      </div>

      <a href="${cobranca.urlPagamento}" target="_blank" rel="noopener"
         style="display:block; margin-top:1.25rem; color:#22d3ee; font-size:.85rem;">
        A aba não abriu? Clique aqui
      </a>

      <button type="button" onclick="fecharModalUpgrade()"
              style="width:100%; margin-top:1.5rem; padding:.85rem; background:rgb(71,85,105); color:white; border:none; border-radius:.75rem; cursor:pointer;">
        Fechar
      </button>
    </div>
  `;

  document.getElementById('btn-close-upgrade-modal')?.addEventListener('click', fecharModalUpgrade);

  if (typeof aguardarConfirmacaoPagamento === 'function') {
    aguardarConfirmacaoPagamento().then((confirmado) => {
      if (confirmado) fecharModalUpgrade();
    });
  }
}

console.log('💳 Checkout Asaas carregado');
