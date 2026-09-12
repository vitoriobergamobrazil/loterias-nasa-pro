# Backend — Configuração do Supabase

Todo dado de loteria exibido no app vem da Caixa através deste backend.
Nada de resultado, prêmio ou histórico é gerado no cliente.

## Por que existe um backend

O portal da Caixa não envia cabeçalhos CORS, então o navegador bloqueia a
chamada feita direto do app. As Edge Functions rodam no servidor, onde essa
restrição não existe, buscam o dado oficial e guardam no banco. O app lê do
banco.

```
Portal da Caixa  →  Edge Function (servidor)  →  Postgres  →  App
```

## Ordem de instalação

### 1. Tabelas (SQL Editor do Supabase)

Execute na ordem, cada arquivo inteiro:

| Arquivo | O que cria |
|---|---|
| `supabase/schema.sql` | Perfis, assinaturas, leads (instalação nova) |
| `supabase/migration-visitor-leads-phone.sql` | Torna o telefone opcional — **sem isso nenhum lead é salvo** |
| `supabase/schema-sorteios.sql` | Cache de prêmio estimado e próximo concurso |
| `supabase/schema-historico.sql` | Histórico oficial de concursos |
| `supabase/schema-exclusao.sql` | Fila de pedidos de exclusão de conta (exigência da Play Store) |

Se o banco já existe, pule o `schema.sql` e rode só os outros quatro.

### 2. Edge Functions

```bash
npm install -g supabase
supabase login
supabase link --project-ref cuqjmzkdwtfiicflksfs

supabase functions deploy fetch-sorteios
supabase functions deploy fetch-resultado
supabase functions deploy sync-historico
supabase functions deploy delete-account
```

| Função | Responsabilidade | Quando roda |
|---|---|---|
| `fetch-sorteios` | Prêmio estimado e número do próximo concurso | Cron a cada 6h |
| `fetch-resultado` | Resultado oficial por concurso ou por data | Sob demanda, ao conferir bilhetes |
| `sync-historico` | Baixa concursos passados para as análises | Cron diário |
| `delete-account` | Exclui conta e dados, ou registra o pedido | Sob demanda |

`delete-account` atende dois fluxos: com sessão válida apaga na hora; sem
sessão (página pública) registra o pedido, porque não há como provar que quem
digitou o e-mail é o dono dele.

As três usam a `service_role` key, que o Supabase injeta automaticamente.
Nenhuma chave precisa ser colocada no código do app.

### 3. Carga inicial do histórico

`sync-historico` trabalha em lotes para não estourar o tempo limite da função
nem o rate limit da Caixa. Rode repetidamente até `faltam` chegar a zero:

```bash
BASE="https://cuqjmzkdwtfiicflksfs.supabase.co/functions/v1"

curl "$BASE/sync-historico?modalidade=megasena&quantidade=50&alvo=200"
curl "$BASE/sync-historico?modalidade=lotofacil&quantidade=50&alvo=200"
```

Resposta:

```json
{"resultado":[{"modalidade":"megasena","inseridos":50,"faltam":150,"total_no_banco":50,"ultimo_concurso":2861}]}
```

São 4 a 5 execuções por modalidade para chegar a 200 concursos.

### 4. Agendamento (Dashboard → Integrations → Cron)

| Função | Frequência sugerida | Motivo |
|---|---|---|
| `fetch-sorteios` | `0 */6 * * *` | O prêmio estimado muda entre sorteios |
| `sync-historico` | `0 3 * * *` | Pega o concurso da véspera; nada a fazer se já estiver no banco |

`fetch-resultado` não entra no cron: é chamada pelo app na hora de conferir.

## Pagamentos (Asaas)

### Tabelas

Rode `supabase/schema-pagamentos.sql`. Ele cria `cobrancas` e acrescenta
`asaas_customer_id` em `profiles`.

Repare que `cobrancas` **não tem policy de escrita**: quem grava é a Edge
Function pela service_role. É isso que impede alguém de marcar o próprio
pagamento como recebido pelo navegador.

### Secrets

```bash
# Sandbox
supabase secrets set ASAAS_API_KEY='<chave do sandbox>'
supabase secrets set ASAAS_API_URL='https://api-sandbox.asaas.com/v3'
supabase secrets set ASAAS_WEBHOOK_TOKEN='<uma senha forte inventada por você>'
```

O `ASAAS_WEBHOOK_TOKEN` é um valor que você escolhe e cadastra igual nos dois
lados: aqui e no painel do Asaas. É ele que prova que o POST veio do gateway.

Ao migrar para produção, troque a chave e a URL para `https://api.asaas.com/v3`.
A chave de produção **nunca** entra no Git nem no front-end.

### Funções

```bash
supabase functions deploy criar-cobranca
supabase functions deploy asaas-webhook
```

| Função | Papel |
|---|---|
| `criar-cobranca` | Cria cobrança ou assinatura. Exige sessão válida e usa o preço da tabela interna, não o que vem do cliente |
| `asaas-webhook` | Recebe a confirmação e é o **único** ponto que concede acesso PRO |

### Webhook no painel do Asaas

Configurações → Integrações → Webhooks:

- **URL:** `https://cuqjmzkdwtfiicflksfs.supabase.co/functions/v1/asaas-webhook`
- **Token de autenticação:** o mesmo valor de `ASAAS_WEBHOOK_TOKEN`
- **Eventos:** todos os de `PAYMENT_*`

O webhook responde 500 quando falha ao gravar, de propósito: o Asaas reenvia
o evento depois, então uma indisponibilidade momentânea não faz o cliente
pagar e ficar sem acesso.

### Fluxo completo

```
App → criar-cobranca → Asaas devolve link de pagamento
Cliente paga (PIX ou cartão na página do Asaas)
Asaas → asaas-webhook → grava cobrança e ativa subscriptions
App (js/assinatura.js) lê subscriptions e libera PRO
```

### O que falta no app

A tela de checkout ainda precisa **coletar CPF** — o Asaas exige `cpfCnpj`
para cadastrar o cliente, e hoje o app não pede esse dado em lugar nenhum.
Ao adicionar, inclua o CPF na tabela de dados coletados da política de
privacidade.

## Como verificar se está no ar

No console do navegador, com o app aberto:

```javascript
window.historico.total()        // { megasena: 200, lotofacil: 200 }
window.sorteios.sincronizar()   // prêmios devem sair de "—"
window.conferencia.ultimo('megasena')
```

Pelo terminal:

```bash
curl "$BASE/fetch-resultado?modalidade=megasena"
curl "$BASE/fetch-resultado?modalidade=megasena&data=28/11/2024"
```

## Comportamento quando o backend está fora

O app nunca preenche lacuna com número inventado. O estado degradado é
sempre declarado na tela:

| Recurso | Sem backend |
|---|---|
| Data e hora do sorteio | Funciona (calendário é fixo e calculado no app) |
| Prêmio estimado | `—` |
| Conferir bilhete | `⚠️ Não foi possível conferir` |
| Bilhete com data futura | `⏳ Aguardando sorteio` |
| Mapa de calor, dezenas quentes/frias | Aviso de histórico não sincronizado |
| Retro-teste | Aviso de histórico não sincronizado |
| Gerar jogos, volante, carteira | Funciona normalmente |

O histórico fica em cache local por 12 horas, então uma queda curta do
servidor não derruba as análises.

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| Prêmio fica em `—` | `fetch-sorteios` nunca rodou; chame pela URL uma vez |
| `⚠️ Não foi possível conferir` | `fetch-resultado` não foi publicada |
| Análises avisando indisponível | Falta rodar a carga do `sync-historico` |
| Leads não aparecem na tabela | Falta a migration do telefone |
| `sync-historico` com `inseridos: 0` e `faltam > 0` | Caixa recusando conexão; espere alguns minutos |
