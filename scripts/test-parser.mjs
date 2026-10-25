export function parsearJogosTexto(textoBruto, dataManual = null) {
  const texto = String(textoBruto || '').trim();
  if (!texto) return { erro: 'Texto vazio' };

  // 1. Detecta Concurso do texto
  let concurso = null;
  const matchConc = texto.match(/concurso\s*[:#]?\s*(\d{3,5})/i) || texto.match(/#(\d{3,5})/i) || texto.match(/conc\.?\s*[:#]?\s*(\d{3,5})/i);
  if (matchConc) concurso = '#' + matchConc[1];

  // 2. Detecta Data do texto
  let data = dataManual;
  if (!data) {
    const matchData = texto.match(/(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})/);
    if (matchData) data = `${matchData[1]}/${matchData[2]}/${matchData[3]}`;
  }

  // 3. Detecta Modalidade do texto se houver
  let modalidadeDetectada = null;
  if (/lotof[aá]cil/i.test(texto)) modalidadeDetectada = 'lotofacil';
  if (/mega[- ]?sena/i.test(texto)) modalidadeDetectada = 'megasena';

  // 4. Divide em linhas para detectar múltiplos jogos
  const linhas = texto.split(/\r?\n/);
  const jogosEncontrados = [];

  for (let linha of linhas) {
    linha = linha.trim();
    if (!linha) continue;

    // Se for cabeçalho ou linha descritiva sem formato de jogo, pula
    if (/^(loterias|modalidade|concurso|total de jogos|gerado|resultado)/i.test(linha)) {
      continue;
    }

    // LIMPEZA CIRÚRGICA DA LINHA:
    // Remove datas completas para que dia e mês não virem dezenas sorteadas!
    let linhaLimpa = linha.replace(/\d{2}[\/\.-]\d{2}[\/\.-]\d{4}/g, ' ')
                          .replace(/#\d{3,5}/g, ' ') // remove #3074
                          .replace(/\b\d{1,2}h\b/gi, ' ') // remove 20h
                          .replace(/\b\d{2}:\d{2}\b/g, ' ') // remove 20:00
                          .replace(/^.*jogo\s*#?\d+\s*[:\-]?\s*/i, ' ')
                          .replace(/^.*aposta\s*#?\d+\s*[:\-]?\s*/i, ' ')
                          .replace(/^.*bilhete\s*#?\d+\s*[:\-]?\s*/i, ' ')
                          .replace(/[\*\_]/g, ' ');

    const nums = (linhaLimpa.match(/\b\d{1,2}\b/g) || []).map(Number);
    const dezenasValidas = Array.from(new Set(nums.filter(n => n >= 1 && n <= 60))).sort((a,b)=>a-b);

    if (dezenasValidas.length >= 6 && dezenasValidas.length <= 20) {
      jogosEncontrados.push(dezenasValidas);
    }
  }

  // Se não achou linha por linha, faz a varredura global
  if (jogosEncontrados.length === 0) {
    let textoGlobalLimpo = texto.replace(/\d{2}[\/\.-]\d{2}[\/\.-]\d{4}/g, ' ')
                                .replace(/#\d{3,5}/g, ' ')
                                .replace(/\b\d{1,2}h\b/gi, ' ')
                                .replace(/\b\d{2}:\d{2}\b/g, ' ')
                                .replace(/[\*\_]/g, ' ');

    const nums = (textoGlobalLimpo.match(/\b\d{1,2}\b/g) || []).map(Number);
    const dezenasValidas = Array.from(new Set(nums.filter(n => n >= 1 && n <= 60))).sort((a,b)=>a-b);
    if (dezenasValidas.length >= 6 && dezenasValidas.length <= 20) {
      jogosEncontrados.push(dezenasValidas);
    }
  }

  return { concurso, data, modalidadeDetectada, jogos: jogosEncontrados };
}

// Teste 1: WhatsApp exportado pelo próprio app
const testeWhatsApp = `🛰️ Loterias NASA Pro — Lote de Apostas
Modalidade: Mega-Sena
Concurso: #2788 (27/10/2026)
Total de Jogos: 2

*Jogo #1:* 04 - 13 - 23 - 28 - 41 - 58
*Jogo #2:* 02 - 15 - 22 - 35 - 44 - 59`;

console.log('Teste WhatsApp:', parsearJogosTexto(testeWhatsApp));

// Teste 2: Concurso anterior com data
const testeAnterior = '#3074 24/10/2026 02 03 20 25 39 57';
console.log('Teste Concurso Anterior:', parsearJogosTexto(testeAnterior));
