import test from 'node:test';
import assert from 'node:assert/strict';

// Importa lógicas combinatórias equivalentes às do app.js
function combinacao(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - (k - i))) / i;
  return Math.round(c);
}

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
function formatarReais(valor) {
  return formatadorMoeda.format(valor);
}

test('Combinatória: Total de jogos possíveis na Mega-Sena C(60, 6)', () => {
  const totalMega = combinacao(60, 6);
  assert.equal(totalMega, 50063860, 'Mega-Sena deve ter exatamente 50.063.860 combinações');
});

test('Combinatória: Total de jogos possíveis na Lotofácil C(25, 15)', () => {
  const totalLoto = combinacao(25, 15);
  assert.equal(totalLoto, 3268760, 'Lotofácil deve ter exatamente 3.268.760 combinações');
});

test('Combinatória: Casos de borda', () => {
  assert.equal(combinacao(10, 0), 1);
  assert.equal(combinacao(10, 10), 1);
  assert.equal(combinacao(10, 11), 0);
  assert.equal(combinacao(10, -1), 0);
});

test('Lotofácil: Moldura e Miolo têm proporção matemática correta', () => {
  const moldura = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
  const miolo = [7, 8, 9, 12, 13, 14, 17, 18, 19];
  
  assert.equal(moldura.length, 16, 'Moldura da Lotofácil deve ter 16 números');
  assert.equal(miolo.length, 9, 'Miolo da Lotofácil deve ter 9 números');
  
  // Não deve haver interseção
  const intersec = moldura.filter(n => miolo.includes(n));
  assert.equal(intersec.length, 0, 'Moldura e miolo não podem compartilhar números');
  
  // A união deve cobrir todos os números de 1 a 25
  const todos = [...moldura, ...miolo].sort((a, b) => a - b);
  assert.equal(todos.length, 25);
  assert.equal(todos[0], 1);
  assert.equal(todos[24], 25);
});

test('Primos: Verificação matemática dos números primos oficiais', () => {
  const primosMega = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
  const primosLoto = [2, 3, 5, 7, 11, 13, 17, 19, 23];
  
  function ehPrimo(num) {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  }
  
  for (const p of primosMega) {
    assert.ok(ehPrimo(p), `${p} deve ser primo`);
    assert.ok(p <= 60, `${p} deve ser <= 60 na Mega-Sena`);
  }
  
  for (const p of primosLoto) {
    assert.ok(ehPrimo(p), `${p} deve ser primo`);
    assert.ok(p <= 25, `${p} deve ser <= 25 na Lotofácil`);
  }
});

test('Formatador Moeda: Converte valores para BRL corretamente', () => {
  const formatado = formatarReais(5.00);
  assert.ok(formatado.includes('5,00'), 'R$ 5,00 deve conter vírgula decimal');
  assert.ok(formatado.includes('R$'), 'Deve conter o símbolo R$');
});
