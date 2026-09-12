// Edge Function: busca prêmio estimado e próximo concurso no portal da Caixa.
// Roda no servidor (Deno), então não sofre a restrição de CORS que bloqueia
// essa mesma chamada no navegador.
//
// REGRA: se a Caixa não responder, NÃO grava nada e NÃO inventa valor.
// O app prefere mostrar "—" a exibir um prêmio falso.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

const ENDPOINTS: Record<string, string> = {
  megasena: "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena",
  lotofacil: "https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil"
}

interface SorteioRow {
  modalidade: string
  proximo_concurso: number
  premio_estimado: number
  data_atualizacao: string
}

async function buscarModalidade(modalidade: string): Promise<SorteioRow | null> {
  const url = ENDPOINTS[modalidade]
  if (!url) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const resposta = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    })

    if (!resposta.ok) {
      console.warn(`${modalidade}: Caixa respondeu ${resposta.status}`)
      return null
    }

    const dados = await resposta.json()

    const concurso = Number(dados?.numeroConcursoProximo ?? dados?.numero)
    const premio = Number(dados?.valorEstimadoProximoConcurso)

    // Sem os dois campos válidos não há o que gravar.
    if (!Number.isFinite(concurso) || concurso <= 0) {
      console.warn(`${modalidade}: concurso ausente na resposta`)
      return null
    }
    if (!Number.isFinite(premio) || premio <= 0) {
      console.warn(`${modalidade}: prêmio estimado ausente na resposta`)
      return null
    }

    return {
      modalidade,
      proximo_concurso: concurso,
      premio_estimado: Math.round(premio),
      data_atualizacao: new Date().toISOString()
    }
  } catch (err) {
    console.warn(`${modalidade}: falha ao consultar Caixa —`, String(err))
    return null
  } finally {
    clearTimeout(timeout)
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS })
  }

  const modalidades = Object.keys(ENDPOINTS)
  const resultados = await Promise.all(modalidades.map(buscarModalidade))
  const validos = resultados.filter((r): r is SorteioRow => r !== null)

  for (const linha of validos) {
    const { error } = await supabase
      .from("sorteios_cache")
      .upsert(linha, { onConflict: "modalidade" })

    if (error) {
      console.error(`Erro ao gravar ${linha.modalidade}:`, error.message)
    }
  }

  const falhas = modalidades.filter(
    (m) => !validos.some((v) => v.modalidade === m)
  )

  return new Response(
    JSON.stringify(validos),
    {
      // 200 mesmo com falha parcial: o app lida com lista vazia mostrando "—"
      status: 200,
      headers: {
        ...CORS,
        "Content-Type": "application/json",
        "X-Sorteios-Falhas": falhas.join(",") || "nenhuma"
      }
    }
  )
})
