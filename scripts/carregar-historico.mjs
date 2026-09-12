#!/usr/bin/env node
// Carrega o histórico oficial de concursos da Caixa para o Supabase.
//
// Roda a partir de uma máquina no Brasil, e não da Edge Function, porque o
// portal da Caixa recusa conexão vinda dos datacenters do Supabase — daqui
// responde normalmente. O navegador do usuário final também alcança a Caixa
// (a API envia Access-Control-Allow-Origin: *), então o app consulta direto;
// este banco serve de cache pronto para quem abre o app pela primeira vez.
//
// Uso:
//   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/carregar-historico.mjs [quantidade]

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJETO_REF = 'cuqjmzkdwtfiicflksfs';
const API = `https://api.supabase.com/v1/projects/${PROJETO_REF}/database/query`;
const CAIXA = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';

const QUANTIDADE = Number(process.argv[2]) || 200;
const MODALIDADES = ['megasena', 'lotofacil'];

// A Caixa começa a recusar conexão em rajada: com 4 paralelos e sem pausa,
// só ~20% dos pedidos voltavam. Cadência baixa entrega quase 100%.
const CONCORRENCIA = 2;
const PAUSA_ENTRE_LOTES_MS = 400;
const TENTATIVAS_POR_CONCURSO = 3;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

if (!TOKEN) {
  console.error('ERRO: falta SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

async function sql(query) {
  const resposta = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const texto = await resposta.text();
  if (!resposta.ok) throw new Error(texto.slice(0, 300));
  try {
    return JSON.parse(texto);
  } catch {
    return [];
  }
}

async function buscarCaixa(modalidade, concurso) {
  const url = concurso ? `${CAIXA}/${modalidade}/${concurso}` : `${CAIXA}/${modalidade}`;
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 15000);

  try {
    const resposta = await fetch(url, {
      signal: controle.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!resposta.ok) return null;

    const dados = await resposta.json();
    const dezenas = (dados?.listaDezenas ?? []).map(Number).filter(Number.isFinite);
    const numero = Number(dados?.numero);
    const data = String(dados?.dataApuracao ?? '');
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data);

    if (!dezenas.length || !Number.isFinite(numero) || !m) return null;

    const rateio = (dados?.listaRateioPremio ?? []).map((f) => ({
      acertos: Number(String(f?.descricaoFaixa ?? '').replace(/\D/g, '')) || 0,
      ganhadores: Number(f?.numeroDeGanhadores) || 0,
      premio: Number(f?.valorPremio) || 0
    }));

    return {
      modalidade,
      concurso: numero,
      data_apuracao: `${m[3]}-${m[2]}-${m[1]}`,
      dezenas: dezenas.sort((a, b) => a - b),
      acumulado: Boolean(dados?.acumulado),
      rateio
    };
  } catch {
    return null;
  } finally {
    clearTimeout(limite);
  }
}

const escapar = (texto) => String(texto).replace(/'/g, "''");

function montarInsert(linhas) {
  const valores = linhas
    .map(
      (l) =>
        `('${l.modalidade}', ${l.concurso}, '${l.data_apuracao}', ` +
        `'{${l.dezenas.join(',')}}', ${l.acumulado}, ` +
        `'${escapar(JSON.stringify(l.rateio))}'::jsonb)`
    )
    .join(',\n');

  return `
    insert into public.concursos_historico
      (modalidade, concurso, data_apuracao, dezenas, acumulado, rateio)
    values
${valores}
    on conflict (modalidade, concurso) do nothing;
  `;
}

async function processar(modalidade) {
  console.log(`\n=== ${modalidade} ===`);

  const ultimo = await buscarCaixa(modalidade);
  if (!ultimo) {
    console.log('  Caixa não respondeu');
    return;
  }
  console.log(`  último concurso: ${ultimo.concurso} (${ultimo.data_apuracao})`);

  const existentes = await sql(
    `select concurso from public.concursos_historico where modalidade = '${modalidade}';`
  );
  const jaTemos = new Set(existentes.map((r) => Number(r.concurso)));
  console.log(`  já no banco: ${jaTemos.size}`);

  const alvo = [];
  for (let n = ultimo.concurso; n > ultimo.concurso - QUANTIDADE && n >= 1; n--) {
    if (!jaTemos.has(n)) alvo.push(n);
  }

  if (!alvo.length) {
    console.log('  nada a baixar');
    return;
  }
  console.log(`  baixando ${alvo.length} concursos...`);

  const buscarComRetry = async (numero) => {
    for (let tentativa = 1; tentativa <= TENTATIVAS_POR_CONCURSO; tentativa++) {
      const resultado = await buscarCaixa(modalidade, numero);
      if (resultado) return resultado;
      // Recusa por rajada passa sozinha; espera crescente antes de insistir.
      await esperar(500 * tentativa);
    }
    return null;
  };

  const coletados = [];
  for (let i = 0; i < alvo.length; i += CONCORRENCIA) {
    const lote = alvo.slice(i, i + CONCORRENCIA);
    const resultados = await Promise.all(lote.map(buscarComRetry));
    coletados.push(...resultados.filter(Boolean));

    process.stdout.write(`    ${coletados.length}/${alvo.length}\r`);
    await esperar(PAUSA_ENTRE_LOTES_MS);
  }
  console.log(`    ${coletados.length}/${alvo.length} obtidos      `);

  // Grava em blocos: um INSERT com 200 linhas estoura o limite da API.
  const BLOCO = 40;
  let gravados = 0;
  for (let i = 0; i < coletados.length; i += BLOCO) {
    const bloco = coletados.slice(i, i + BLOCO);
    await sql(montarInsert(bloco));
    gravados += bloco.length;
    process.stdout.write(`    gravados ${gravados}/${coletados.length}\r`);
  }
  console.log(`    gravados ${gravados}/${coletados.length}      `);
}

(async () => {
  for (const modalidade of MODALIDADES) {
    await processar(modalidade);
  }

  console.log('\n=== total no banco ===');
  const total = await sql(
    `select modalidade, count(*) as total, min(data_apuracao) as mais_antigo,
            max(data_apuracao) as mais_recente
     from public.concursos_historico group by modalidade order by modalidade;`
  );
  console.table(total);
})();
