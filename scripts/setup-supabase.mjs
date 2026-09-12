#!/usr/bin/env node
// Setup completo do backend no Supabase: tabelas, Edge Functions e carga
// inicial do histórico de concursos.
//
// Uso:
//   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/setup-supabase.mjs
//
// Escrito em Node (e não em shell) porque o ambiente Windows aqui não tem jq
// e o escape de SQL grande em bash é frágil.
//
// É idempotente: os schemas usam IF NOT EXISTS e a carga do histórico pula o
// que já está no banco. Pode rodar de novo sem estragar nada.

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJETO_REF = 'cuqjmzkdwtfiicflksfs';
const API = 'https://api.supabase.com/v1';
const FUNCOES = `https://${PROJETO_REF}.supabase.co/functions/v1`;

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  console.error('\nERRO: falta o SUPABASE_ACCESS_TOKEN.\n');
  console.error('Gere em https://supabase.com/dashboard/account/tokens');
  console.error('Depois rode:\n');
  console.error('  SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-supabase.mjs\n');
  process.exit(1);
}

const SCHEMAS = [
  'supabase/migration-visitor-leads-phone.sql',
  'supabase/schema-sorteios.sql',
  'supabase/schema-historico.sql',
  'supabase/schema-exclusao.sql',
  'supabase/schema-pagamentos.sql'
];

// criar-cobranca e asaas-webhook ficam de fora: dependem da chave do Asaas,
// que ainda não existe. Publicá-las agora só criaria endpoint devolvendo 503.
const FUNCOES_DEPLOY = [
  'fetch-sorteios',
  'fetch-resultado',
  'sync-historico',
  'delete-account'
];

const titulo = (texto) => {
  console.log('\n' + '='.repeat(52));
  console.log(' ' + texto);
  console.log('='.repeat(52));
};

async function executarSQL(caminhoRelativo) {
  const caminho = join(RAIZ, caminhoRelativo);
  process.stdout.write(`  ${caminhoRelativo} ... `);

  if (!existsSync(caminho)) {
    console.log('não encontrado, pulando');
    return;
  }

  const query = readFileSync(caminho, 'utf-8');

  const resposta = await fetch(`${API}/projects/${PROJETO_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const texto = await resposta.text();

  if (resposta.ok) {
    console.log('ok');
    return;
  }

  // Reexecutar o setup traz "already exists"; isso é esperado, não é falha.
  if (/already exists|já existe/i.test(texto)) {
    console.log('já existia (ok)');
    return;
  }

  console.log('FALHOU');
  console.log(`    ${texto.slice(0, 300)}`);
}

function publicarFuncao(nome) {
  process.stdout.write(`  ${nome} ... `);
  try {
    execSync(
      `npx --yes supabase@latest functions deploy ${nome} ` +
        `--project-ref ${PROJETO_REF} --no-verify-jwt`,
      {
        cwd: RAIZ,
        stdio: 'pipe',
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: TOKEN }
      }
    );
    console.log('publicada');
  } catch (err) {
    console.log('FALHOU');
    const saida = (err.stderr?.toString() || err.stdout?.toString() || '').trim();
    console.log(`    ${saida.slice(0, 300)}`);
  }
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function carregarHistorico(modalidade) {
  console.log(`\n  ${modalidade}:`);

  for (let lote = 1; lote <= 6; lote++) {
    try {
      const resposta = await fetch(
        `${FUNCOES}/sync-historico?modalidade=${modalidade}&quantidade=50&alvo=200`
      );
      const dados = await resposta.json();
      const info = dados?.resultado?.[0] ?? dados;

      console.log(
        `    lote ${lote}: +${info.inseridos ?? 0} concursos, ` +
          `faltam ${info.faltam ?? '?'} (total ${info.total_no_banco ?? '?'})`
      );

      if (info.erro) {
        console.log(`    erro do servidor: ${info.erro}`);
        return;
      }
      if (info.faltam === 0) {
        console.log('    completo');
        return;
      }
    } catch (err) {
      console.log(`    lote ${lote}: falhou (${err.message})`);
      return;
    }

    // Respiro entre lotes: o portal da Caixa recusa conexão sob rajada.
    await esperar(3000);
  }
}

async function principal() {
  titulo('1/4  Tabelas');
  for (const schema of SCHEMAS) {
    await executarSQL(schema);
  }

  titulo('2/4  Edge Functions');
  for (const funcao of FUNCOES_DEPLOY) {
    publicarFuncao(funcao);
  }

  titulo('3/4  Histórico oficial de concursos');
  await carregarHistorico('megasena');
  await carregarHistorico('lotofacil');

  titulo('4/4  Prêmio estimado do próximo concurso');
  try {
    const resposta = await fetch(`${FUNCOES}/fetch-sorteios`);
    console.log('  ' + (await resposta.text()).slice(0, 400));
  } catch (err) {
    console.log(`  falhou: ${err.message}`);
  }

  console.log('\nPronto. No app, confira com: window.historico.total()\n');
}

principal().catch((err) => {
  console.error('\nFalha no setup:', err);
  process.exit(1);
});
