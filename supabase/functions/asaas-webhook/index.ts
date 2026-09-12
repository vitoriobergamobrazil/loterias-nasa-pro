// Edge Function: recebe eventos de pagamento do Asaas.
//
// É o único ponto que concede acesso PRO. O app nunca libera plano por conta
// própria: quem manda é a confirmação do gateway, que chega aqui.
//
// Autenticação: o Asaas envia em todo POST o header `asaas-access-token` com
// o valor cadastrado no painel (Configurações → Integrações → Webhooks). Sem
// conferir isso, qualquer um descobriria a URL e liberaria PRO de graça.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN") ?? ""

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" }
  })

/** Comparação de tempo constante: evita vazar o token por medida de tempo. */
function tokensIguais(recebido: string, esperado: string) {
  if (recebido.length !== esperado.length) return false
  let diferenca = 0
  for (let i = 0; i < recebido.length; i++) {
    diferenca |= recebido.charCodeAt(i) ^ esperado.charCodeAt(i)
  }
  return diferenca === 0
}

// Evento do Asaas -> estado da cobrança
const MAPA_EVENTOS: Record<string, string> = {
  PAYMENT_CREATED: "pendente",
  PAYMENT_AWAITING_RISK_ANALYSIS: "pendente",
  PAYMENT_APPROVED_BY_RISK_ANALYSIS: "pendente",
  PAYMENT_CONFIRMED: "confirmada",
  PAYMENT_RECEIVED: "recebida",
  PAYMENT_OVERDUE: "vencida",
  PAYMENT_REFUNDED: "estornada",
  PAYMENT_REPROVED_BY_RISK_ANALYSIS: "cancelada",
  PAYMENT_DELETED: "cancelada",
  PAYMENT_CHARGEBACK_REQUESTED: "estornada",
  PAYMENT_CHARGEBACK_DISPUTE: "estornada"
}

// Estados que dão acesso PRO. "confirmada" já libera: o pagamento foi aprovado,
// mesmo que o dinheiro só caia na conta no repasse (D+1, D+30 no cartão).
const LIBERAM_ACESSO = new Set(["confirmada", "recebida"])
const REVOGAM_ACESSO = new Set(["estornada", "cancelada", "vencida"])

const DURACAO_PLANO_DIAS: Record<string, number> = {
  avulso: 30,
  mensal: 31,
  anual: 366
}

function validadeDoPlano(plano: string): string {
  const dias = DURACAO_PLANO_DIAS[plano] ?? 31
  const data = new Date()
  data.setDate(data.getDate() + dias)
  return data.toISOString()
}

serve(async (req) => {
  if (req.method !== "POST") return json({ erro: "use POST" }, 405)

  if (!WEBHOOK_TOKEN) {
    console.error("ASAAS_WEBHOOK_TOKEN não configurado")
    return json({ erro: "webhook não configurado" }, 503)
  }

  const tokenRecebido = req.headers.get("asaas-access-token") ?? ""
  if (!tokensIguais(tokenRecebido, WEBHOOK_TOKEN)) {
    return json({ erro: "não autorizado" }, 401)
  }

  let corpo: { event?: string; payment?: Record<string, any> }
  try {
    corpo = await req.json()
  } catch {
    return json({ erro: "json inválido" }, 400)
  }

  const evento = String(corpo.event ?? "")
  const pagamento = corpo.payment

  if (!pagamento?.id) return json({ erro: "evento sem pagamento" }, 400)

  const novoStatus = MAPA_EVENTOS[evento]
  if (!novoStatus) {
    // Evento que não afeta acesso (ex.: atualização de nota fiscal).
    // Responder 200 evita que o Asaas fique reenviando.
    return json({ ignorado: evento })
  }

  // externalReference foi gravado por criar-cobranca como "userId|plano".
  const [userIdRef, planoRef] = String(pagamento.externalReference ?? "").split("|")

  // A cobrança pode já existir (criada por nós) ou não (gerada pela renovação
  // automática da assinatura, que o Asaas cria sozinho).
  const { data: existente } = await admin
    .from("cobrancas")
    .select("user_id, plano, email")
    .eq("id", pagamento.id)
    .maybeSingle()

  const userId = existente?.user_id ?? (userIdRef || null)
  const plano = existente?.plano ?? (planoRef || "mensal")

  const { error: erroCobranca } = await admin.from("cobrancas").upsert(
    {
      id: pagamento.id,
      user_id: userId,
      email: existente?.email ?? pagamento.customer ?? "desconhecido",
      plano,
      valor: Number(pagamento.value) || 0,
      metodo: pagamento.billingType ?? "UNDEFINED",
      status: novoStatus,
      url_pagamento: pagamento.invoiceUrl ?? null,
      vence_em: pagamento.dueDate ?? null,
      paga_em: LIBERAM_ACESSO.has(novoStatus) ? new Date().toISOString() : null,
      evento_bruto: corpo
    },
    { onConflict: "id" }
  )

  if (erroCobranca) {
    console.error("Erro ao gravar cobrança:", erroCobranca.message)
    // 500 faz o Asaas reenviar depois, o que é o comportamento desejado.
    return json({ erro: "falha ao gravar" }, 500)
  }

  // Sem usuário identificado não há assinatura a atualizar. A cobrança fica
  // registrada para conciliação manual.
  if (!userId) {
    console.warn(`Pagamento ${pagamento.id} sem usuário vinculado`)
    return json({ ok: true, aviso: "cobranca_sem_usuario" })
  }

  if (LIBERAM_ACESSO.has(novoStatus)) {
    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        provider: "asaas",
        provider_customer_id: pagamento.customer ?? null,
        provider_subscription_id: pagamento.subscription ?? pagamento.id,
        plan_code: plano,
        status: "active",
        valid_until: validadeDoPlano(plano),
        updated_at: new Date().toISOString()
      },
      { onConflict: "provider_subscription_id" }
    )

    if (error) {
      console.error("Erro ao ativar assinatura:", error.message)
      return json({ erro: "falha ao ativar" }, 500)
    }
  }

  if (REVOGAM_ACESSO.has(novoStatus)) {
    const status = novoStatus === "vencida" ? "past_due" : "canceled"
    const { error } = await admin
      .from("subscriptions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("provider_subscription_id", pagamento.subscription ?? pagamento.id)

    if (error) console.error("Erro ao revogar assinatura:", error.message)
  }

  return json({ ok: true, evento, status: novoStatus })
})
