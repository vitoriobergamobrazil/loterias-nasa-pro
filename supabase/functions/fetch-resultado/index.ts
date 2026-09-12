// Edge Function: resultado oficial de um concurso da Caixa.
//
// Usada para CONFERIR BILHETES. Por isso a regra aqui é ainda mais rígida
// que a do prêmio estimado: se não der para confirmar o resultado oficial,
// responde "indisponível" — nunca um palpite. Dizer "não premiado" sem ter
// conferido é tão errado quanto dizer "você ganhou".
//
// GET ?modalidade=megasena                  -> último concurso
// GET ?modalidade=megasena&concurso=2800    -> concurso específico
// GET ?modalidade=megasena&data=28/11/2024  -> concurso daquela data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

const BASE = "https://servicebus2.caixa.gov.br/portaldeloterias/api"

// 0=domingo ... 6=sábado
const DIAS_SORTEIO: Record<string, number[]> = {
  megasena: [3, 6],
  lotofacil: [1, 2, 3, 4, 5, 6]
}

interface Resultado {
  modalidade: string
  concurso: number
  data: string
  dezenas: number[]
  acumulado: boolean
  rateio: { acertos: number; ganhadores: number; premio: number }[]
}

function parseDataBR(texto: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((texto || "").trim())
  if (!m) return null
  const [, dia, mes, ano] = m
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia))
  return Number.isNaN(data.getTime()) ? null : data
}

/** Quantos sorteios da modalidade ocorrem de `de` (exclusivo) até `ate` (inclusivo). */
function contarSorteiosEntre(de: Date, ate: Date, modalidade: string): number {
  const dias = DIAS_SORTEIO[modalidade]
  if (!dias) return 0

  const inicio = new Date(de)
  inicio.setHours(0, 0, 0, 0)
  const fim = new Date(ate)
  fim.setHours(0, 0, 0, 0)

  const sentido = fim >= inicio ? 1 : -1
  let total = 0
  const cursor = new Date(inicio)

  // Trava de segurança: ~10 anos de dias.
  for (let i = 0; i < 4000; i++) {
    cursor.setDate(cursor.getDate() + sentido)
    if (dias.includes(cursor.getDay())) total += sentido
    if (cursor.getTime() === fim.getTime()) break
  }

  return total
}

async function buscarConcurso(
  modalidade: string,
  concurso?: number
): Promise<Resultado | null> {
  const url = concurso ? `${BASE}/${modalidade}/${concurso}` : `${BASE}/${modalidade}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const resposta = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    })

    if (!resposta.ok) return null

    const dados = await resposta.json()
    const dezenas = (dados?.listaDezenas ?? []).map(Number).filter(Number.isFinite)

    // Concurso sem dezenas ainda não foi sorteado.
    if (!dezenas.length) return null

    const rateio = (dados?.listaRateioPremio ?? []).map((faixa: any) => ({
      acertos: Number(String(faixa?.descricaoFaixa ?? "").replace(/\D/g, "")) || 0,
      ganhadores: Number(faixa?.numeroDeGanhadores) || 0,
      premio: Number(faixa?.valorPremio) || 0
    }))

    return {
      modalidade,
      concurso: Number(dados?.numero),
      data: String(dados?.dataApuracao ?? ""),
      dezenas: dezenas.sort((a: number, b: number) => a - b),
      acumulado: Boolean(dados?.acumulado),
      rateio
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Encontra o concurso de uma data. Estima pelo calendário fixo e confirma
 * contra a data real devolvida pela Caixa, ajustando se a estimativa errar
 * (feriados e sorteios especiais deslocam a numeração).
 */
async function buscarPorData(modalidade: string, alvo: Date): Promise<Resultado | null> {
  const ultimo = await buscarConcurso(modalidade)
  if (!ultimo) return null

  const dataUltimo = parseDataBR(ultimo.data)
  if (!dataUltimo) return null

  if (dataUltimo.getTime() === alvo.getTime()) return ultimo

  // Data futura: o sorteio ainda não aconteceu.
  if (alvo > dataUltimo) return null

  const diferenca = contarSorteiosEntre(alvo, dataUltimo, modalidade)
  let estimativa = ultimo.concurso - diferenca

  for (let tentativa = 0; tentativa <= 3; tentativa++) {
    if (estimativa < 1) return null

    const candidato = await buscarConcurso(modalidade, estimativa)
    if (!candidato) return null

    const dataCandidato = parseDataBR(candidato.data)
    if (!dataCandidato) return null
    if (dataCandidato.getTime() === alvo.getTime()) return candidato

    // Anda na direção do erro, um concurso por vez.
    estimativa += dataCandidato > alvo ? -1 : 1
  }

  return null
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS })
  }

  const url = new URL(req.url)
  const modalidade = (url.searchParams.get("modalidade") ?? "megasena").toLowerCase()
  const concursoParam = url.searchParams.get("concurso")
  const dataParam = url.searchParams.get("data")

  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" }
    })

  if (!DIAS_SORTEIO[modalidade]) {
    return responder({ erro: "modalidade inválida" }, 400)
  }

  try {
    let resultado: Resultado | null

    if (dataParam) {
      const alvo = parseDataBR(dataParam)
      if (!alvo) return responder({ erro: "data deve estar em dd/mm/aaaa" }, 400)
      resultado = await buscarPorData(modalidade, alvo)
    } else {
      const numero = concursoParam ? Number(concursoParam) : undefined
      if (concursoParam && (!Number.isFinite(numero) || numero! < 1)) {
        return responder({ erro: "concurso inválido" }, 400)
      }
      resultado = await buscarConcurso(modalidade, numero)
    }

    if (!resultado) {
      return responder({ disponivel: false }, 200)
    }

    return responder({ disponivel: true, ...resultado })
  } catch (err) {
    console.error("fetch-resultado:", err)
    return responder({ disponivel: false, erro: "falha ao consultar a Caixa" }, 200)
  }
})
