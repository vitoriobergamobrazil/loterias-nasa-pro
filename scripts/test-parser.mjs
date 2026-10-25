export function sugerirDezenasFaltantes(dezenasAtuais, modalidade = 'megasena', qtdFaltam = 1, freqHistorica = {}) {
  const max = modalidade === 'lotofacil' ? 25 : 60;
  const atuaisSet = new Set(dezenasAtuais.map(Number));
  const metadeCorte = modalidade === 'lotofacil' ? 13 : 30;

  const paresAtuais = dezenasAtuais.filter(n => n % 2 === 0).length;
  const imparesAtuais = dezenasAtuais.length - paresAtuais;
  const baixosAtuais = dezenasAtuais.filter(n => n <= metadeCorte).length;
  const altosAtuais = dezenasAtuais.length - baixosAtuais;

  const candidatos = [];
  for (let num = 1; num <= max; num++) {
    if (atuaisSet.has(num)) continue;
    let score = 50;
    const motivos = [];

    // 1. Balanceamento Par/Ímpar
    const ehPar = num % 2 === 0;
    if (paresAtuais < imparesAtuais && ehPar) {
      score += 25;
      motivos.push('Equilíbrio Par/Ímpar');
    } else if (imparesAtuais < paresAtuais && !ehPar) {
      score += 25;
      motivos.push('Equilíbrio Par/Ímpar');
    }

    // 2. Metade Baixa / Alta
    if (baixosAtuais < altosAtuais && num <= metadeCorte) {
      score += 15;
      motivos.push('Compensação Baixa/Alta');
    } else if (altosAtuais < baixosAtuais && num > metadeCorte) {
      score += 15;
      motivos.push('Compensação Baixa/Alta');
    }

    // 3. Frequência Histórica
    const freq = freqHistorica[num] || 0;
    score += Math.min(freq * 2, 20);

    candidatos.push({
      dezena: num,
      score,
      motivo: motivos.join(' + ') || 'Convergência Estatística'
    });
  }

  candidatos.sort((a,b) => b.score - a.score || a.dezena - b.dezena);
  const escolhidos = candidatos.slice(0, qtdFaltam);
  const dezenasSugeridas = escolhidos.map(c => c.dezena);
  const jogoCompleto = [...dezenasAtuais, ...dezenasSugeridas].sort((a,b) => a-b);

  return {
    dezenasSugeridas,
    justificativa: escolhidos[0]?.motivo || 'Otimização Estatística NASA',
    jogoCompleto
  };
}

export function parsearJogosTexto(textoBruto, dataManual = null, freqHistorica = {}) {
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
  if (/lotof[aá]cil|loto\s*f[aá]cil/i.test(texto)) modalidadeDetectada = 'lotofacil';
  else if (/mega[- ]?sena|\bmega\b/i.test(texto)) modalidadeDetectada = 'megasena';

  // 4. Divide em linhas para detectar múltiplos jogos
  const linhas = texto.split(/\r?\n/);
  const jogosEncontrados = [];
  const jogosIncompletos = [];

  const processarLinhaDezenas = (dezenasValidas) => {
    const maxNum = Math.max(...dezenasValidas);
    const mod = modalidadeDetectada || (maxNum <= 25 && dezenasValidas.length >= 13 ? 'lotofacil' : 'megasena');

    if (mod === 'lotofacil') {
      if (dezenasValidas.length >= 15 && dezenasValidas.length <= 20) {
        jogosEncontrados.push(dezenasValidas);
      } else if (dezenasValidas.length >= 13 && dezenasValidas.length < 15) {
        const faltam = 15 - dezenasValidas.length;
        const sugestao = sugerirDezenasFaltantes(dezenasValidas, 'lotofacil', faltam, freqHistorica);
        jogosIncompletos.push({ dezenas: dezenasValidas, modalidade: 'lotofacil', faltam, sugestao });
      }
    } else {
      // Mega-Sena
      if (dezenasValidas.length >= 6 && dezenasValidas.length <= 20) {
        jogosEncontrados.push(dezenasValidas);
      } else if (dezenasValidas.length >= 4 && dezenasValidas.length < 6) {
        const faltam = 6 - dezenasValidas.length;
        const sugestao = sugerirDezenasFaltantes(dezenasValidas, 'megasena', faltam, freqHistorica);
        jogosIncompletos.push({ dezenas: dezenasValidas, modalidade: 'megasena', faltam, sugestao });
      }
    }
  };

  for (let linha of linhas) {
    linha = linha.trim();
    if (!linha) continue;

    // Se for cabeçalho ou linha descritiva sem formato de jogo, pula
    if (/^(loterias|modalidade|concurso|total de jogos|gerado|resultado|parab[eé]ns)/i.test(linha)) {
      continue;
    }

    // LIMPEZA CIRÚRGICA DA LINHA:
    let linhaLimpa = linha.replace(/\d{2}[\/\.-]\d{2}[\/\.-]\d{4}/g, ' ')
                          .replace(/#\d{3,5}/g, ' ')
                          .replace(/\b\d{1,2}h\b/gi, ' ')
                          .replace(/\b\d{2}:\d{2}\b/g, ' ')
                          .replace(/r\$\s*[\d\,\.]+/gi, ' ')
                          .replace(/^.*jogo\s*#?\d+\s*[:\-]?\s*/i, ' ')
                          .replace(/^.*aposta\s*#?\d+\s*[:\-]?\s*/i, ' ')
                          .replace(/^.*bilhete\s*#?\d+\s*[:\-]?\s*/i, ' ')
                          .replace(/[\*\_]/g, ' ');

    const nums = (linhaLimpa.match(/\b\d{1,2}\b/g) || []).map(Number);
    const dezenasValidas = Array.from(new Set(nums.filter(n => n >= 1 && n <= 60))).sort((a,b)=>a-b);

    if (dezenasValidas.length >= 4) {
      processarLinhaDezenas(dezenasValidas);
    }
  }

  // Se não achou linha por linha, faz a varredura global no texto completo
  if (jogosEncontrados.length === 0 && jogosIncompletos.length === 0) {
    let textoGlobalLimpo = texto.replace(/\d{2}[\/\.-]\d{2}[\/\.-]\d{4}/g, ' ')
                                .replace(/#\d{3,5}/g, ' ')
                                .replace(/\b\d{1,2}h\b/gi, ' ')
                                .replace(/\b\d{2}:\d{2}\b/g, ' ')
                                .replace(/r\$\s*[\d\,\.]+/gi, ' ')
                                .replace(/[\*\_]/g, ' ');

    const nums = (textoGlobalLimpo.match(/\b\d{1,2}\b/g) || []).map(Number);
    const dezenasValidas = Array.from(new Set(nums.filter(n => n >= 1 && n <= 60))).sort((a,b)=>a-b);
    if (dezenasValidas.length >= 4) {
      processarLinhaDezenas(dezenasValidas);
    }
  }

  return { concurso, data, modalidadeDetectada, jogos: jogosEncontrados, incompletos: jogosIncompletos };
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
