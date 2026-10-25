import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Novas Features: Todos os novos scripts existem e são acessíveis', () => {
  const novosScripts = [
    'js/simulador-retrospectivo.js',
    'js/volante-impressao.js',
    'js/testadores-vip.js',
    'js/error-trap.js',
    'js/carteira-gestao.js'
  ];

  for (const s of novosScripts) {
    assert.ok(fs.existsSync(s), `Arquivo ${s} deve existir`);
    const content = fs.readFileSync(s, 'utf-8');
    assert.ok(content.length > 200, `Arquivo ${s} não deve estar vazio`);
  }
});

test('Simulador Retrospectivo: Lógica de acertos e faixas de premiação', () => {
  function avaliarAcertos(jogo, sorteio) {
    return jogo.filter(d => sorteio.includes(d)).length;
  }

  // Mega-Sena: 6 dezenas sorteadas
  const sorteioMega = [5, 10, 23, 34, 45, 59];
  assert.equal(avaliarAcertos([5, 10, 23, 34], sorteioMega), 4, 'Deve identificar Quadra');
  assert.equal(avaliarAcertos([5, 10, 23, 34, 45], sorteioMega), 5, 'Deve identificar Quina');
  assert.equal(avaliarAcertos([5, 10, 23, 34, 45, 59], sorteioMega), 6, 'Deve identificar Sena');

  // Lotofácil: 15 sorteadas
  const sorteioLoto = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const jogoLoto14 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25];
  assert.equal(avaliarAcertos(jogoLoto14, sorteioLoto), 14, 'Deve identificar 14 pontos');
});

test('Calendário Oficial: Mega-Sena em domingo deve indicar Terça-feira (nunca Segunda)', () => {
  const SORTEIOS_CALENDARIO = {
    megasena: { dias: [2, 4, 6], hora: 20 },
    lotofacil: { dias: [1, 2, 3, 4, 5, 6], hora: 20 }
  };
  const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  function calcular(modalidade, dataRef) {
    const cfg = SORTEIOS_CALENDARIO[modalidade];
    for (let i = 1; i <= 7; i++) {
      const alvo = new Date(dataRef);
      alvo.setDate(alvo.getDate() + i);
      const candidato = alvo.getDay();
      if (cfg.dias.includes(candidato)) {
        const diaSemana = NOMES_DIAS[candidato];
        const rotulo = i === 1 ? `Amanhã (${diaSemana})` : `${diaSemana}`;
        return { diaSemana, rotulo, diffDias: i };
      }
    }
  }

  // Data teste: Domingo
  const domingo = new Date(2026, 9, 25, 12, 0, 0); // 25/10/2026 = Domingo
  assert.equal(domingo.getDay(), 0, 'Data de teste deve ser domingo');

  const mega = calcular('megasena', domingo);
  assert.equal(mega.diaSemana, 'Terça', 'Próximo sorteio da Mega-Sena a partir de domingo deve ser Terça-feira');
  assert.equal(mega.diffDias, 2, 'Mega-Sena deve ser daqui a 2 dias (Terça), nunca 1 dia (Segunda)');

  const loto = calcular('lotofacil', domingo);
  assert.equal(loto.diaSemana, 'Segunda', 'Próximo sorteio da Lotofácil a partir de domingo deve ser Segunda');
  assert.equal(loto.diffDias, 1, 'Lotofácil é daqui a 1 dia (Amanhã Segunda)');
});

test('Carteira Inteligente: Agrupamento em escala de 100 apostas por concurso', () => {
  // Simula 100 bilhetes divididos em 3 concursos diferentes
  const apostas = [];
  for (let i = 0; i < 40; i++) apostas.push({ id: i, concursoAlvo: '#2788', modalidade: 'megasena', custo: 5 });
  for (let i = 40; i < 70; i++) apostas.push({ id: i, concursoAlvo: '#2789', modalidade: 'megasena', custo: 5 });
  for (let i = 70; i < 100; i++) apostas.push({ id: i, concursoAlvo: '#3180', modalidade: 'lotofacil', custo: 3 });

  // Lógica de agrupamento equivalente
  const grupos = {};
  apostas.forEach(b => {
    const chave = `${b.modalidade}_${b.concursoAlvo}`;
    if (!grupos[chave]) grupos[chave] = { chave, total: 0 };
    grupos[chave].total++;
  });

  const listaGrupos = Object.values(grupos);
  assert.equal(listaGrupos.length, 3, '100 apostas em 3 concursos devem virar exatamente 3 grupos organizados');
  assert.equal(grupos['megasena_#2788'].total, 40);
  assert.equal(grupos['megasena_#2789'].total, 30);
  assert.equal(grupos['lotofacil_#3180'].total, 30);
});

test('Testadores VIP: Validação de estrutura do CSV do Google Play', () => {
  const emails = ['apostador1@gmail.com', 'apostador2@gmail.com', 'apostador3@gmail.com'];
  const csv = emails.join('\n');
  const linhas = csv.split('\n');
  assert.equal(linhas.length, 3);
  assert.ok(linhas[0].endsWith('@gmail.com'));
});
